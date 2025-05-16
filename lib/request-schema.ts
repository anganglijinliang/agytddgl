import { z } from 'zod';
import { UserRole } from '@prisma/client';

// 登录验证Schema
export const loginSchema = z.object({
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  password: z.string().min(6, { message: '密码至少需要6个字符' }),
  remember: z.boolean().optional(),
});

// 注册验证Schema
export const registerSchema = z.object({
  name: z.string().min(2, { message: '用户名至少需要2个字符' }),
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  password: z.string().min(6, { message: '密码至少需要6个字符' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

// 客户信息Schema
export const customerSchema = z.object({
  name: z.string().min(2, { message: '客户名称至少需要2个字符' }),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: '请输入有效的邮箱地址' }).optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

// 订单基础信息Schema
export const orderBaseSchema = z.object({
  customerId: z.string({ required_error: '请选择客户' }),
  shippingMethod: z.enum(['SELF_DELIVERY', 'CUSTOMER_PICKUP'], { 
    required_error: '请选择发运方式' 
  }),
  shippingAddress: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'PARTIALLY_SHIPPED', 'COMPLETED', 'CANCELED'], {
    required_error: '请选择订单状态'
  }).default('DRAFT'),
  totalAmount: z.number().optional(),
  paymentStatus: z.string().optional(),
});

// 子订单信息Schema
export const subOrderSchema = z.object({
  specification: z.string({ required_error: '请选择规格' }),
  grade: z.string({ required_error: '请选择级别' }),
  interfaceType: z.string({ required_error: '请选择接口形式' }),
  lining: z.string({ required_error: '请选择内衬' }),
  length: z.string({ required_error: '请选择长度' }),
  anticorrosion: z.string({ required_error: '请选择防腐措施' }),
  plannedQuantity: z.number({ 
    required_error: '请输入计划支数',
    invalid_type_error: '请输入有效的数字'
  }).positive({ message: '计划支数必须大于0' }),
  productionLineId: z.string().optional(),
  warehouseId: z.string().optional(),
  deliveryDate: z.date({ required_error: '请选择交货日期' }),
  priorityLevel: z.enum(['NORMAL', 'URGENT', 'CRITICAL'], {
    required_error: '请选择优先级'
  }).default('NORMAL'),
  unitWeight: z.number({ 
    required_error: '请输入单重',
    invalid_type_error: '请输入有效的数字'
  }).positive({ message: '单重必须大于0' }),
  notes: z.string().optional(),
});

// 生产信息Schema
export const productionSchema = z.object({
  subOrderId: z.string({ required_error: '请选择子订单' }),
  productionLineId: z.string({ required_error: '请选择产线' }),
  team: z.enum(['TEAM_A', 'TEAM_B', 'TEAM_C', 'TEAM_D'], {
    required_error: '请选择班组'
  }),
  shift: z.enum(['NIGHT_SHIFT', 'DAY_SHIFT', 'MIDDLE_SHIFT'], {
    required_error: '请选择班次'
  }),
  productionDate: z.date({ required_error: '请选择生产日期' }),
  quantity: z.number({ 
    required_error: '请输入生产支数',
    invalid_type_error: '请输入有效的数字'
  }).positive({ message: '生产支数必须大于0' }),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  qualityNotes: z.string().optional(),
  materialUsage: z.string().optional(),
  notes: z.string().optional(),
});

// 发运信息Schema
export const shippingSchema = z.object({
  subOrderId: z.string({ required_error: '请选择子订单' }),
  warehouseId: z.string({ required_error: '请选择仓库' }),
  shippingDate: z.date({ required_error: '请选择发运日期' }),
  transportType: z.enum(['TRAIN', 'TRUCK', 'SHIP', 'OTHER'], {
    required_error: '请选择运输方式'
  }),
  carrierName: z.string().optional(),
  vehicleInfo: z.string().optional(),
  driverInfo: z.string().optional(),
  shippingNumber: z.string().optional(),
  quantity: z.number({ 
    required_error: '请输入发运支数',
    invalid_type_error: '请输入有效的数字'
  }).positive({ message: '发运支数必须大于0' }),
  destinationInfo: z.string().optional(),
  estimatedArrival: z.date().optional(),
  notes: z.string().optional(),
});

// 用户信息Schema
export const userSchema = z.object({
  name: z.string().min(2, { message: '用户名至少需要2个字符' }),
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  password: z.string().min(6, { message: '密码至少需要6个字符' }).optional(),
  role: z.nativeEnum(UserRole, { required_error: '请选择用户角色' }),
  image: z.string().optional(),
}); 