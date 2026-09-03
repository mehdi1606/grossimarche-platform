import React, { useEffect, useState } from "react";
import {
  Table,
  TableCell,
  TableContainer,
  TableHeader,
} from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import {
  FiShoppingBag,
  FiUsers,
  FiTrendingUp,
  FiPackage,
  FiArrowUpRight,
} from "react-icons/fi";
import "chart.js/auto";
import { Line, Doughnut, Pie, Bar } from "react-chartjs-2";
import dayjs from "dayjs";

//internal import
import useAsync from "@/hooks/useAsync";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import OrderServices from "@/services/OrderServices";
import OrderTable from "@/components/order/OrderTable";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import PageTitle from "@/components/Typography/PageTitle";
import AnimatedContent from "@/components/common/AnimatedContent";

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

// Ease-out count-up so the KPI numbers animate in on load.
const useCountUp = (end, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const to = Number(end) || 0;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return val;
};

const StatCard = ({ icon: Icon, label, value, money, currency, sub, gradient, delay = 0 }) => {
  const v = useCountUp(value);
  const display = money
    ? `${currency}${v.toFixed(2)}`
    : Math.round(v).toLocaleString();
  return (
    <div
      className="gm-fade-in-up relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-transform duration-300 hover:-translate-y-1"
      style={{ background: gradient, animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-6 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{display}</p>
          {sub && <p className="mt-1 text-xs text-white/70">{sub}</p>}
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
          <Icon className="text-xl" />
        </span>
      </div>
    </div>
  );
};

const SectionCard = ({ title, action, children, className = "" }) => (
  <div
    className={`gm-fade-in-up rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
  >
    <div className="mb-4 flex items-center justify-between">
      <h3 className="font-serif text-base font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const KpiSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="gm-skeleton h-28 rounded-2xl" />
    ))}
  </div>
);

/* ------------------------------------------------------------------ *
 * Dashboard
 * ------------------------------------------------------------------ */

const Dashboard = () => {
  const { t } = useTranslation();
  const { currency } = useUtilsFunction();

  // 100% backend-driven - every figure below comes from these endpoints.
  const { data: summary, loading: loadingSummary } = useAsync(
    OrderServices.getDashboardAmount
  );
  const { data: sales, loading: loadingSales } = useAsync(() =>
    OrderServices.getDashboardSales(30)
  );
  const { data: bestSellers, loading: loadingBest } = useAsync(
    OrderServices.getBestSellerProductChart
  );

  // Where deliveries go, and who buys. Both come from the API rather than being derived from
  // the orders already on screen: that list is the ten most recent, which would make the
  // charts a picture of this morning instead of the business.
  const { data: cityRows, loading: loadingCities } = useAsync(
    OrderServices.getDeliveriesByCity
  );
  const { data: typeRows, loading: loadingTypes } = useAsync(
    OrderServices.getCustomersByType
  );
  const { data: recent, loading: loadingRecent } = useAsync(() =>
    OrderServices.getDashboardRecentOrder({ limit: 8 })
  );

  const money = (v) => `${currency}${Number(v || 0).toFixed(2)}`;
  const salesPoints = Array.isArray(sales) ? sales : [];
  const bestList = Array.isArray(bestSellers) ? bestSellers : [];
  const recentOrders = recent?.orders || [];

  // ---- Sales line chart (revenue over the last 30 days) ----
  const lineData = {
    labels: salesPoints.map((p) => dayjs(p.date).format("DD/MM")),
    datasets: [
      {
        label: "Chiffre d'affaires",
        data: salesPoints.map((p) => Number(p.revenue || 0)),
        borderColor: "#10b981",
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(16,185,129,0.15)";
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "rgba(16,185,129,0.35)");
          g.addColorStop(1, "rgba(16,185,129,0)");
          return g;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#10b981",
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: "#9ca3af" } },
      y: { grid: { color: "rgba(148,163,184,0.15)" }, ticks: { color: "#9ca3af" }, beginAtZero: true },
    },
    interaction: { mode: "index", intersect: false },
  };

  // ---- Order-status doughnut ----
  const statusEntries = [
    { key: "pendingOrders", label: t("OrderPending"), color: "#f59e0b" },
    { key: "processingOrders", label: t("OrderProcessing"), color: "#3b82f6" },
    { key: "deliveredOrders", label: t("OrderDelivered"), color: "#10b981" },
    { key: "cancelledOrders", label: "Annulées", color: "#ef4444" },
  ];
  const doughnutData = {
    labels: statusEntries.map((s) => s.label),
    datasets: [
      {
        data: statusEntries.map((s) => Number(summary?.[s.key] || 0)),
        backgroundColor: statusEntries.map((s) => s.color),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: { legend: { display: false } },
  };
  const totalStatus = statusEntries.reduce(
    (s, e) => s + Number(summary?.[e.key] || 0),
    0
  );

  // One palette for both breakdowns, so a city and a segment never fight over the same hue
  // inside one screen. Ordered so neighbouring slices stay distinguishable.
  const BREAKDOWN_COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#14b8a6",
    "#ec4899",
    "#6366f1",
    "#84cc16",
    "#f97316",
    "#94a3b8",
  ];

  const cityList = Array.isArray(cityRows) ? cityRows : [];
  const typeList = Array.isArray(typeRows) ? typeRows : [];
  const cityTotal = cityList.reduce((sum, r) => sum + Number(r.count || 0), 0);

  const cityPieData = {
    labels: cityList.map((r) => r.label),
    datasets: [
      {
        data: cityList.map((r) => Number(r.count || 0)),
        backgroundColor: cityList.map(
          (_, i) => BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length]
        ),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const cityPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // A slice means nothing without its share of the whole.
          label: (ctx) => {
            const value = Number(ctx.parsed) || 0;
            const share = cityTotal ? Math.round((value / cityTotal) * 100) : 0;
            return ` ${ctx.label} : ${value} livraison${value > 1 ? "s" : ""} (${share} %)`;
          },
        },
      },
    },
  };

  const typeBarData = {
    labels: typeList.map((r) => r.label),
    datasets: [
      {
        label: "Clients",
        data: typeList.map((r) => Number(r.count || 0)),
        // One colour per segment, from the same palette as the pie: a segment keeps the same
        // hue wherever it appears on the dashboard.
        backgroundColor: typeList.map(
          (_, i) => BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length]
        ),
        borderRadius: 6,
        maxBarThickness: 46,
      },
    ],
  };

  const typeBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      // Counts are whole clients: a "2.5" gridline would be nonsense.
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>{t("DashboardOverview")}</PageTitle>
        <span className="hidden items-center gap-2 text-xs font-medium text-gray-400 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Données en direct · {dayjs().format("DD MMM YYYY")}
        </span>
      </div>

      <AnimatedContent>
        {/* KPI cards */}
        {loadingSummary ? (
          <KpiSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={FiTrendingUp}
              label="Chiffre d'affaires du jour"
              value={summary?.revenueToday}
              money
              currency={currency}
              sub={`Ce mois-ci : ${money(summary?.revenueMonth)}`}
              gradient="linear-gradient(135deg,#059669,#10b981)"
              delay={0}
            />
            <StatCard
              icon={FiShoppingBag}
              label="Commandes du jour"
              value={summary?.ordersToday}
              currency={currency}
              sub={`Ce mois-ci : ${summary?.ordersMonth ?? 0}`}
              gradient="linear-gradient(135deg,#2563eb,#3b82f6)"
              delay={80}
            />
            <StatCard
              icon={FiUsers}
              label="Clients"
              value={summary?.totalCustomers}
              currency={currency}
              sub="Comptes clients inscrits"
              gradient="linear-gradient(135deg,#7c3aed,#a855f7)"
              delay={160}
            />
            <StatCard
              icon={FiPackage}
              label="Total des commandes"
              value={summary?.totalOrders}
              currency={currency}
              sub={`${summary?.deliveredOrders ?? 0} livrées`}
              gradient="linear-gradient(135deg,#ea580c,#f97316)"
              delay={240}
            />
          </div>
        )}

        {/* Sales chart + order status */}
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Chiffre d'affaires · 30 derniers jours"
            className="xl:col-span-2"
            action={
              <span className="text-xs font-medium text-emerald-600">
                {money(summary?.revenueWeek)} this week
              </span>
            }
          >
            <div className="h-72">
              {loadingSales ? (
                <div className="gm-skeleton h-full w-full rounded-xl" />
              ) : salesPoints.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-gray-400">
                  Aucune vente pour le moment.
                </div>
              ) : (
                <Line data={lineData} options={lineOptions} />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Commandes par statut">
            <div className="relative mx-auto h-44 w-44">
              {loadingSummary ? (
                <div className="gm-skeleton h-full w-full rounded-full" />
              ) : (
                <>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {totalStatus}
                    </span>
                    <span className="text-xs text-gray-400">orders</span>
                  </div>
                </>
              )}
            </div>
            <ul className="mt-5 space-y-2">
              {statusEntries.map((s) => (
                <li key={s.key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.label}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {summary?.[s.key] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* Deliveries per city + customers per trade */}
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Livraisons par ville"
            action={
              cityTotal > 0 && (
                <span className="text-xs font-medium text-gray-400">
                  {cityTotal} livraison{cityTotal > 1 ? "s" : ""}
                </span>
              )
            }
          >
            <div className="h-60">
              {loadingCities ? (
                <div className="gm-skeleton h-full w-full rounded-xl" />
              ) : cityList.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-gray-400">
                  Aucune livraison enregistrée.
                </div>
              ) : (
                <Pie data={cityPieData} options={cityPieOptions} />
              )}
            </div>

            {/* Legend as a list, not chart.js's own: it carries the counts, and it wraps
                instead of squeezing the pie when a city name is long. */}
            {cityList.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {cityList.map((row, i) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
                        }}
                      />
                      <span className="truncate">{row.label}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-gray-800 dark:text-gray-100">
                      {row.count}
                      <span className="ml-1.5 text-xs font-normal text-gray-400">
                        {cityTotal ? Math.round((row.count / cityTotal) * 100) : 0} %
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Clients par type d&apos;activité" className="xl:col-span-2">
            <div className="h-72">
              {loadingTypes ? (
                <div className="gm-skeleton h-full w-full rounded-xl" />
              ) : typeList.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-gray-400">
                  Aucun client enregistré.
                </div>
              ) : (
                <Bar data={typeBarData} options={typeBarOptions} />
              )}
            </div>
          </SectionCard>
        </div>

        {/* Best sellers + recent orders */}
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <SectionCard title="Meilleures ventes">
            {loadingBest ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="gm-skeleton h-10 rounded-lg" />
                ))}
              </div>
            ) : bestList.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Aucune vente enregistrée pour le moment.
              </p>
            ) : (
              <ul className="space-y-1">
                {bestList.map((p, i) => (
                  <li
                    key={p.productId || i}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-amber-100 text-amber-600"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                      {p.name}
                    </span>
                    <span className="text-xs text-gray-400">×{p.quantitySold}</span>
                    <span className="w-20 text-right text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {money(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title={t("RecentOrder")}
            className="xl:col-span-2"
            action={
              <a
                href="/orders"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
              >
                Tout voir <FiArrowUpRight />
              </a>
            }
          >
            {loadingRecent ? (
              <TableSkeleton rows={6} cols={5} />
            ) : recentOrders.length === 0 ? (
              <EmptyState
                icon={FiShoppingBag}
                title="Aucune commande"
                description="Les dernières commandes passées apparaîtront ici."
              />
            ) : (
              <TableContainer className="rounded-lg">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableCell>{t("InvoiceNo")}</TableCell>
                      <TableCell>{t("TimeTbl")}</TableCell>
                      <TableCell>{t("CustomerName")}</TableCell>
                      <TableCell>{t("MethodTbl")}</TableCell>
                      <TableCell>{t("AmountTbl")}</TableCell>
                      <TableCell>{t("OderStatusTbl")}</TableCell>
                      <TableCell>{t("ActionTbl")}</TableCell>
                      <TableCell className="text-right">{t("InvoiceTbl")}</TableCell>
                    </tr>
                  </TableHeader>
                  <OrderTable orders={recentOrders} />
                </Table>
              </TableContainer>
            )}
          </SectionCard>
        </div>
      </AnimatedContent>
    </>
  );
};

export default Dashboard;
