const prisma = require("../prisma/client");
const { sendOrderConfirmation, sendAdminOrderNotification } = require("../utils/sendOrderConfirmation");
const { generateInvoicePdf } = require("../utils/generateInvoice");

const SHIPPING_OPTIONS = {
  daewoo:     { label: "Delivery via Daewoo FastEx", cost: 350, taxable: true },
  leopard:    { label: "Delivery via Leopard Courier Service", cost: 350, taxable: true },
  tcs:        { label: "Delivery via TCS Courier Service", cost: 350, taxable: true },
  advance:    { label: "Advance Payment", cost: 350, taxable: false },
  withinCity: { label: "Within City Only (Multan)", cost: 250, taxable: true },
  pickup:     { label: "Self Pickup (Multan)", cost: 0, taxable: false },
};
const TAX_RATE = 0.04;
const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

exports.getShippingOptions = (req, res) => {
  const options = Object.entries(SHIPPING_OPTIONS).map(([key, v]) => ({
    key, label: v.label, cost: v.cost, taxable: v.taxable
  }));
  res.json(options);
};

exports.checkout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { addressId, addressOverride, shippingOption, paymentMethod, notes } = req.body;

        if (!shippingOption || !SHIPPING_OPTIONS[shippingOption]) {
            return res.status(400).json({ message: "A valid shippingOption is required." });
        }
        const { label: shippingLabel, cost: shippingCost, taxable } = SHIPPING_OPTIONS[shippingOption];

        // Address resolution priority: explicit override text > explicit saved addressId > user's default saved shipping address
        let formattedAddress;
        if (addressOverride && addressOverride.trim()) {
            formattedAddress = addressOverride.trim();
        } else if (addressId) {
            const address = await prisma.address.findUnique({ where: { id: Number(addressId) } });
            if (!address) return res.status(404).json({ message: "Address not found." });
            if (address.userId !== userId) return res.status(403).json({ message: "Forbidden." });
            formattedAddress = `${address.fullName}, ${address.street}, ${address.city} — ${address.phone}`;
        } else {
            const saved = await prisma.address.findUnique({ where: { userId_type: { userId, type: "shipping" } } });
            if (!saved) {
                return res.status(400).json({ message: "No saved address found. Please provide an address." });
            }
            formattedAddress = `${saved.fullName}, ${saved.street}, ${saved.city} — ${saved.phone}`;
        }

        const finalPaymentMethod = paymentMethod === "WhatsApp" ? "WhatsApp" : "COD";

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true, project: true } } }
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty." });
        }

        const validItems = cart.items.filter((item) =>
            item.itemType === "PROJECT" ? item.project !== null : item.product !== null
        );
        if (validItems.length === 0) {
            return res.status(400).json({ message: "Your cart items are no longer available." });
        }

        for (const item of validItems) {
            if (item.itemType === "PRODUCT" && item.quantity > item.product.stock) {
                return res.status(400).json({
                    message: `${item.product.name} only has ${item.product.stock} units left. Please update your cart.`
                });
            }
        }

        const subtotal = validItems.reduce((sum, item) => {
            const price = item.itemType === "PROJECT" ? item.project.price : item.product.price;
            return sum + item.quantity * price;
        }, 0);

        const taxAmount = taxable ? Math.round((subtotal + shippingCost) * TAX_RATE) : 0;
        const total = subtotal + shippingCost + taxAmount;

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    shippingAddress: formattedAddress,
                    billingAddress: formattedAddress,
                    shippingMethod: shippingLabel,
                    shippingCost,
                    subtotal,
                    taxAmount,
                    total,
                    paymentMethod: finalPaymentMethod,
                    notes: notes || null,
                    status: "pending"
                }
            });

            for (const item of validItems) {
                const isProject = item.itemType === "PROJECT";
                const price = isProject ? item.project.price : item.product.price;
                const name = isProject ? item.project.title : item.product.name;

                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        itemType: item.itemType,
                        productId: isProject ? null : item.productId,
                        projectId: isProject ? item.projectId : null,
                        itemName: name,
                        quantity: item.quantity,
                        priceAtOrder: price
                    }
                });

                if (!isProject) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }

            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            return newOrder;
        });

        const fullOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: true }
        });

        // Sent BEFORE the response, and awaited, so the function can't be
        // frozen/torn down (common on serverless hosts like Vercel) before
        // the email actually finishes sending. Both senders have their own
        // internal try/catch and never throw, so this can't crash the
        // order — worst case the order succeeds and an email is skipped.
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user?.email) {
                await sendOrderConfirmation(fullOrder, user.email);
                await sendAdminOrderNotification(fullOrder, user.email);
            }
        } catch (emailErr) {
            console.error("Failed to look up user / send confirmation email:", emailErr);
        }

        res.status(201).json({ message: "Order placed successfully.", order: fullOrder });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await prisma.order.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: "desc" }
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orderId = Number(req.params.id);
        if (!Number.isInteger(orderId)) return res.status(400).json({ message: "Invalid order id." });

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) return res.status(404).json({ message: "Order not found." });
        if (order.userId !== userId) return res.status(403).json({ message: "Forbidden." });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin only — list every order, with customer info included
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                items: true,
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin only — sets fulfillment status and/or tracking number
exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const { status, trackingNumber } = req.body;

        if (!Number.isInteger(orderId)) return res.status(400).json({ message: "Invalid order id." });
        if (status && !ORDER_STATUSES.includes(status)) {
            return res.status(400).json({ message: `status must be one of: ${ORDER_STATUSES.join(", ")}` });
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                ...(status && { status }),
                ...(trackingNumber !== undefined && { trackingNumber })
            }
        });

        res.json({ message: "Order updated.", order });
    } catch (error) {
        console.error(error);
        if (error.code === "P2025") return res.status(404).json({ message: "Order not found." });
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin only — permanently deletes an order and its line items
exports.deleteOrder = async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        if (!Number.isInteger(orderId)) return res.status(400).json({ message: "Invalid order id." });

        await prisma.$transaction(async (tx) => {
            await tx.orderItem.deleteMany({ where: { orderId } });
            await tx.order.delete({ where: { id: orderId } });
        });

        res.json({ message: "Order deleted." });
    } catch (error) {
        console.error(error);
        if (error.code === "P2025") return res.status(404).json({ message: "Order not found." });
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin only — deletes multiple orders at once
exports.deleteOrders = async (req, res) => {
    try {
        const { orderIds } = req.body;

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ message: "orderIds must be a non-empty array." });
        }
        const ids = orderIds.map(Number);
        if (ids.some((id) => !Number.isInteger(id))) {
            return res.status(400).json({ message: "All orderIds must be valid integers." });
        }

        await prisma.$transaction(async (tx) => {
            await tx.orderItem.deleteMany({ where: { orderId: { in: ids } } });
            await tx.order.deleteMany({ where: { id: { in: ids } } });
        });

        res.json({ message: `${ids.length} order(s) deleted.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Downloads a PDF invoice for an order. Customers can only fetch their own
// order's invoice; admins (req.user.role === "ADMIN") can fetch any order's.
exports.downloadInvoice = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orderId = Number(req.params.id);
        if (!Number.isInteger(orderId)) return res.status(400).json({ message: "Invalid order id." });

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true, user: { select: { name: true, email: true } } }
        });

        if (!order) return res.status(404).json({ message: "Order not found." });
        if (order.userId !== userId && req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Forbidden." });
        }

        generateInvoicePdf(order, order.user, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};