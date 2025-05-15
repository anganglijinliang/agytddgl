"use server";

import { db } from "@/lib/db";

interface CustomerData {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
}

// 初始客户数据
const initialCustomers: CustomerData[] = [
  {
    name: "河南省市政工程有限公司",
    contactName: "张经理",
    phone: "13812345678",
    address: "河南省郑州市金水区",
    province: "河南省",
    city: "郑州市",
  },
  {
    name: "安徽城建工程有限公司",
    contactName: "王经理",
    phone: "15898765432",
    address: "安徽省合肥市蜀山区",
    province: "安徽省",
    city: "合肥市",
  },
  {
    name: "山东供水设备有限公司",
    contactName: "李工",
    phone: "18756789012",
    email: "lishengshui@example.com",
    address: "山东省济南市历下区",
    province: "山东省",
    city: "济南市",
  },
  {
    name: "北京市政建设集团",
    contactName: "刘总",
    phone: "13967890123",
    email: "liuzongjian@example.com",
    address: "北京市朝阳区",
    province: "北京市",
    city: "朝阳区",
  },
  {
    name: "上海水务工程有限公司",
    contactName: "陈经理",
    phone: "13078901234",
    address: "上海市浦东新区",
    province: "上海市",
    city: "浦东新区",
  },
];

// 导入基础数据
export async function importBasicCustomers() {
  try {
    // 检查是否已经有客户数据，避免重复导入
    const existingCount = await db.customer.count();
    
    if (existingCount > 0) {
      return { success: true, message: "已存在客户数据，跳过导入" };
    }
    
    // 批量创建客户
    const createdCustomers = await db.customer.createMany({
      data: initialCustomers,
    });
    
    return { 
      success: true, 
      message: `成功导入 ${createdCustomers.count} 个客户数据` 
    };
  } catch (error) {
    console.error("导入客户数据失败:", error);
    return { 
      success: false, 
      message: "导入客户数据失败，请查看系统日志" 
    };
  }
}

// 导入规格数据
export async function importSpecifications() {
  try {
    // 检查是否已经有规格数据
    const existingCount = await db.specification.count();
    
    if (existingCount > 0) {
      return { success: true, message: "已存在规格数据，跳过导入" };
    }
    
    // 规格数据
    const specifications = [
      { value: "DN100-0.18", description: "公称直径100mm", unitWeight: 0.18 },
      { value: "DN150-0.26", description: "公称直径150mm", unitWeight: 0.26 },
      { value: "DN200-0.35", description: "公称直径200mm", unitWeight: 0.35 },
      { value: "DN250-0.45", description: "公称直径250mm", unitWeight: 0.45 },
      { value: "DN300-0.55", description: "公称直径300mm", unitWeight: 0.55 },
      { value: "DN350-0.68", description: "公称直径350mm", unitWeight: 0.68 },
      { value: "DN400-0.80", description: "公称直径400mm", unitWeight: 0.80 },
      { value: "DN450-0.95", description: "公称直径450mm", unitWeight: 0.95 },
      { value: "DN500-1.10", description: "公称直径500mm", unitWeight: 1.10 },
      { value: "DN600-1.40", description: "公称直径600mm", unitWeight: 1.40 },
    ];
    
    // 批量创建规格数据
    const created = await db.specification.createMany({
      data: specifications,
    });
    
    return { 
      success: true, 
      message: `成功导入 ${created.count} 个规格数据` 
    };
  } catch (error) {
    console.error("导入规格数据失败:", error);
    return { 
      success: false, 
      message: "导入规格数据失败，请查看系统日志" 
    };
  }
}

// 导入基础数据
export async function importAllMasterData() {
  try {
    const results = await Promise.all([
      importBasicCustomers(),
      importSpecifications(),
      // 可以添加更多基础数据导入函数
    ]);
    
    const allSuccess = results.every(r => r.success);
    
    return { 
      success: allSuccess,
      message: allSuccess 
        ? "所有基础数据导入成功" 
        : "部分基础数据导入失败，请查看系统日志"
    };
  } catch (error) {
    console.error("导入基础数据失败:", error);
    return { 
      success: false, 
      message: "导入基础数据过程中发生错误，请查看系统日志" 
    };
  }
} 