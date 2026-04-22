-- ============================================
-- Finance App - Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 银行账户表
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0.00,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 预算表（每月每分类）
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  monthly_limit DECIMAL(12,2) NOT NULL,
  month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, month)
);

-- 薪水记录表
CREATE TABLE IF NOT EXISTS salary_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(12,2) NOT NULL,
  month TEXT NOT NULL UNIQUE,
  savings_pct DECIMAL(5,2) DEFAULT 30.00,
  essential_pct DECIMAL(5,2) DEFAULT 50.00,
  lifestyle_pct DECIMAL(5,2) DEFAULT 20.00,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 储蓄目标表
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 启用 Row Level Security
-- ============================================
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户全权操作（个人 App）
CREATE POLICY "allow_all" ON bank_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON salary_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON savings_goals FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 启用 Realtime（实时更新）
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE salary_records;

-- ============================================
-- 初始数据
-- ============================================
INSERT INTO bank_accounts (name, balance, color) VALUES
  ('Public Bank', 0, '#1E3A8A'),
  ('UOB', 0, '#991B1B')
ON CONFLICT DO NOTHING;

INSERT INTO savings_goals (name, target_amount) VALUES
  ('RM100k 存款目标', 100000)
ON CONFLICT DO NOTHING;
