// utils/deployHook.js
//
// Shared helper for triggering Vercel's deploy hook from blogController.js,
// projectController.js, and productController.js. Centralized here (rather
// than copy-pasted per controller) so the cooldown state below is genuinely
// shared across all three — a blog post and a product created seconds apart
// count as one burst, not two independent triggers.
//
// COOLDOWN + TRAILING TRIGGER: while the catalog listing is actively in
// progress, products (and sometimes blog/project edits) can be created in
// rapid bursts — tens per hour. Without a cooldown, every single
// create/update/delete fires its own full Vercel build, queuing up many
// redundant redeploys back-to-back.
//
// Behavior: the first change in a burst triggers an immediate redeploy.
// Further changes within COOLDOWN_MS are skipped but scheduled — a single
// trailing timer is set (or pushed back, if it already exists) to fire
// once COOLDOWN_MS of inactivity has passed, so the last change in a burst
// always eventually gets its own redeploy rather than silently waiting on
// a trigger that never arrives.
//
// This is in-memory (plain module-level variables), which is fine for a
// single backend instance on Railway. If this service ever runs multiple
// instances/replicas behind a load balancer, each instance keeps its own
// timer — in practice this just means occasionally slightly more
// redeploys than strictly necessary, never fewer, so it fails safe.

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

let lastTriggeredAt = 0;
let trailingTimer = null;

const fireDeployHook = () => {
    const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

    if (!hookUrl) {
        console.warn("VERCEL_DEPLOY_HOOK_URL not set — skipping redeploy trigger.");
        return;
    }

    lastTriggeredAt = Date.now();

    fetch(hookUrl, { method: "POST" })
        .then(() => console.log("[deploy-hook] Frontend redeploy triggered."))
        .catch((err) => {
            // Reset so a network failure doesn't accidentally block real
            // triggers for the full cooldown window when nothing actually
            // got queued on Vercel's end.
            lastTriggeredAt = 0;
            console.error("[deploy-hook] Failed to trigger redeploy:", err.message);
        });
};

const triggerFrontendRedeploy = () => {
    const now = Date.now();
    const msSinceLastTrigger = now - lastTriggeredAt;

    if (msSinceLastTrigger >= COOLDOWN_MS) {
        // Outside the cooldown window — fire right away, same as before.
        if (trailingTimer) {
            clearTimeout(trailingTimer);
            trailingTimer = null;
        }
        fireDeployHook();
        return;
    }

    // Inside the cooldown window — skip the immediate fire, but (re)schedule
    // a trailing trigger so this change isn't lost if nothing else happens
    // for the rest of the cooldown period.
    const secondsLeft = Math.ceil((COOLDOWN_MS - msSinceLastTrigger) / 1000);
    console.log(
        `[deploy-hook] Skipped — last redeploy was ${Math.floor(msSinceLastTrigger / 1000)}s ago. ` +
        `Trailing redeploy scheduled in ${secondsLeft}s to catch up this and any further changes.`
    );

    if (trailingTimer) clearTimeout(trailingTimer);
    trailingTimer = setTimeout(() => {
        trailingTimer = null;
        fireDeployHook();
    }, COOLDOWN_MS - msSinceLastTrigger);
};

module.exports = { triggerFrontendRedeploy };