const SiteVisit = require('../models/SiteVisit');
const OnlineVisitor = require('../models/OnlineVisitor');

// Helper: "YYYY-MM-DD" for a given Date
function dateStr(d) {
    return d.toISOString().slice(0, 10);
}

// Helper: date key N days ago
function daysAgo(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() - n);
    return dateStr(r);
}

// Helper: start of current week (Monday)
function weekStart(d) {
    const r = new Date(d);
    const day = r.getDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1) - day;
    r.setDate(r.getDate() + diff);
    return dateStr(r);
}

// POST /api/visits/ping  — called by every visitor every 60s
exports.ping = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.json({ success: false });

        const today = dateStr(new Date());

        // Upsert daily count — only increment once per session per day
        // (store sessionId+date in OnlineVisitor; if new, bump count)
        const existing = await OnlineVisitor.findOne({ sessionId });
        const isNewToday = !existing || existing.lastSeen.toISOString().slice(0, 10) !== today;

        if (isNewToday) {
            await SiteVisit.findOneAndUpdate(
                { date: today },
                { $inc: { count: 1 } },
                { upsert: true, new: true }
            );
        }

        // Update/create the online session record
        await OnlineVisitor.findOneAndUpdate(
            { sessionId },
            { lastSeen: new Date() },
            { upsert: true }
        );

        return res.json({ success: true });
    } catch (err) {
        console.error('Visit ping error:', err.message);
        return res.json({ success: false });
    }
};

// GET /api/visits/stats  — returns all counters
exports.getStats = async (req, res) => {
    try {
        const now = new Date();
        const today = dateStr(now);
        const yesterday = daysAgo(now, 1);

        // Current week: Monday to today
        const thisWeekStart = weekStart(now);

        // Last week: the week before
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const lastWeekEndStr = dateStr(lastWeekEnd);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        const lastWeekStartStr = dateStr(lastWeekStart);

        // Current month
        const thisMonthStart = `${today.slice(0, 7)}-01`;

        // Last month
        const lmDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStart = dateStr(lmDate);
        const lmEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthEnd = dateStr(lmEndDate);

        // Fetch all visits docs in one query
        const all = await SiteVisit.find({});

        const sum = (docs, from, to) =>
            docs.filter(d => d.date >= from && d.date <= to)
                .reduce((s, d) => s + d.count, 0);

        const total = all.reduce((s, d) => s + d.count, 0);
        const todayCount = sum(all, today, today);
        const yestCount = sum(all, yesterday, yesterday);
        const thisWeekCount = sum(all, thisWeekStart, today);
        const lastWeekCount = sum(all, lastWeekStartStr, lastWeekEndStr);
        const thisMonthCount = sum(all, thisMonthStart, today);
        const lastMonthCount = sum(all, lastMonthStart, lastMonthEnd);

        // Online visitors: last seen within 20 min
        const cutoff = new Date(Date.now() - 20 * 60 * 1000);
        const onlineCount = await OnlineVisitor.countDocuments({ lastSeen: { $gte: cutoff } });

        return res.json({
            success: true,
            data: {
                total,
                today: todayCount,
                yesterday: yestCount,
                thisWeek: thisWeekCount,
                lastWeek: lastWeekCount,
                thisMonth: thisMonthCount,
                lastMonth: lastMonthCount,
                online: onlineCount,
            }
        });
    } catch (err) {
        console.error('Visit stats error:', err.message);
        return res.status(500).json({ success: false });
    }
};
