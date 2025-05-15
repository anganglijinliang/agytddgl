/**
 * 系统配置文件
 */

interface NavItem {
  title: string;
  href: string;
  icon?: string;
  resource?: string;
  items?: NavItem[];
}

interface DashboardConfig {
  mainNav: NavItem[];
}

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "控制台",
      href: "/dashboard",
      icon: "dashboard",
    },
    {
      title: "订单管理",
      href: "/orders",
      icon: "orders",
      resource: "orders",
      items: [
        {
          title: "订单列表",
          href: "/orders",
          resource: "orders",
        },
        {
          title: "创建订单",
          href: "/orders/new",
          resource: "orders:create",
        },
        {
          title: "看板视图",
          href: "/orders/kanban",
          resource: "orders",
        },
        {
          title: "日历视图",
          href: "/orders/calendar",
          resource: "orders",
        },
      ],
    },
    {
      title: "生产管理",
      href: "/production",
      icon: "production",
      resource: "production",
      items: [
        {
          title: "生产计划",
          href: "/production",
          resource: "production",
        },
        {
          title: "生产线管理",
          href: "/production/lines",
          resource: "production",
        },
        {
          title: "排程看板",
          href: "/production/scheduler",
          resource: "production:scheduling",
        },
      ],
    },
    {
      title: "库存管理",
      href: "/inventory",
      icon: "inventory",
      resource: "inventory",
    },
    {
      title: "发运管理",
      href: "/shipping",
      icon: "shipping",
      resource: "shipping",
    },
    {
      title: "数据分析",
      href: "/analytics",
      icon: "analytics",
      resource: "analytics",
    },
    {
      title: "系统设置",
      href: "/settings",
      icon: "settings",
      resource: "settings",
      items: [
        {
          title: "用户管理",
          href: "/settings/users",
          resource: "users:manage",
        },
        {
          title: "审计日志",
          href: "/settings/audit-logs",
          resource: "audit:view",
        },
        {
          title: "参数配置",
          href: "/settings/parameters",
          resource: "settings",
        },
      ],
    },
  ],
}; 