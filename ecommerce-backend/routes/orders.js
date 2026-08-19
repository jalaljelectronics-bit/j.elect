const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
    checkout,
    getMyOrders,
    getOrderById,
    getShippingOptions,
    updateOrderStatus,
    getAllOrders,
    deleteOrder,
    deleteOrders,
    downloadInvoice
} = require("../controller/orderController");

router.get("/shipping-options", getShippingOptions);
router.post("/", auth, checkout);
router.get("/", auth, getMyOrders);
router.get("/admin/all", auth, admin, getAllOrders);
router.get("/:id/invoice", auth, downloadInvoice);
router.get("/:id", auth, getOrderById);
router.put("/:id/status", auth, admin, updateOrderStatus);
router.delete("/bulk-delete", auth, admin, deleteOrders);
router.delete("/:id", auth, admin, deleteOrder);

module.exports = router;