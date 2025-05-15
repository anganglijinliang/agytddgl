"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      // 在实际环境中，这里应该调用API来处理联系请求
      // 目前仅显示成功消息作为示例
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast.success("您的消息已发送，管理员会尽快与您联系");
    } catch (error) {
      console.error(error);
      toast.error("发送消息失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">联系管理员</CardTitle>
            <CardDescription className="text-center">
              {!submitted 
                ? "请填写以下信息，我们会尽快与您联系"
                : "您的消息已发送，我们会尽快回复"
              }
            </CardDescription>
          </CardHeader>
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="name">
                    姓名
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="请输入您的姓名"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="email">
                    邮箱
                  </label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="请输入您的邮箱地址"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="company">
                    公司
                  </label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="请输入您的公司名称"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="message">
                    消息
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="请输入您想要咨询的内容"
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  className="w-full bg-brand-600 hover:bg-brand-700" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "发送中..." : "发送消息"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  asChild
                >
                  <Link href="/login">返回登录</Link>
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                感谢您的留言，我们的管理员会尽快与您联系。
              </p>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  asChild
                >
                  <Link href="/login">返回登录</Link>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
} 