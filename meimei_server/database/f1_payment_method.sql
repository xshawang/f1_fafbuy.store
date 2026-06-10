-- F1 支付方式记录表（Stripe payment_methods 拦截存储）
CREATE TABLE IF NOT EXISTS `f1_payment_method` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',

  -- billing_details
  `billing_name` VARCHAR(200) NOT NULL DEFAULT '' COMMENT '账单姓名',
  `billing_email` VARCHAR(200) NOT NULL DEFAULT '' COMMENT '账单邮箱',
  `billing_phone` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '账单电话',
  `billing_city` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '账单城市',
  `billing_country` VARCHAR(10) NOT NULL DEFAULT '' COMMENT '账单国家',
  `billing_line1` VARCHAR(300) NOT NULL DEFAULT '' COMMENT '账单地址行1',
  `billing_line2` VARCHAR(300) NOT NULL DEFAULT '' COMMENT '账单地址行2',
  `billing_postal_code` VARCHAR(20) NOT NULL DEFAULT '' COMMENT '账单邮编',
  `billing_state` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '账单州/省',

  -- card
  `type` VARCHAR(50) NOT NULL DEFAULT 'card' COMMENT '支付类型',
  `card_number` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '卡号',
  `card_last4` VARCHAR(4) NOT NULL DEFAULT '' COMMENT '卡号后4位',
  `card_cvc` VARCHAR(10) NOT NULL DEFAULT '' COMMENT 'CVC安全码',
  `card_exp_year` VARCHAR(4) NOT NULL DEFAULT '' COMMENT '过期年份',
  `card_exp_month` VARCHAR(2) NOT NULL DEFAULT '' COMMENT '过期月份',

  -- 其他Stripe字段
  `allow_redisplay` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '允许重新展示设置',
  `pasted_fields` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '粘贴字段',
  `payment_user_agent` VARCHAR(300) NOT NULL DEFAULT '' COMMENT '支付用户代理',
  `referrer` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '来源页面',
  `time_on_page` VARCHAR(20) NOT NULL DEFAULT '' COMMENT '页面停留时间（毫秒）',
  `guid` VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'GUID标识',
  `muid` VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'MUID标识',
  `sid` VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'SID标识',
  `stripe_key` VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Stripe公钥',
  `client_attribution_metadata` TEXT NULL COMMENT '客户端归因元数据（JSON）',
  `radar_options` TEXT NULL COMMENT '雷达选项（JSON）',
  `raw_body` TEXT NULL COMMENT '原始请求体',
  `ip_address` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '请求来源IP',
  `user_agent` VARCHAR(500) NOT NULL DEFAULT '' COMMENT 'User-Agent',

  -- BaseEntity 字段
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` VARCHAR(30) NOT NULL DEFAULT '' COMMENT '创建人',
  `update_by` VARCHAR(30) NOT NULL DEFAULT '' COMMENT '更新人',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '版本号',

  -- 索引
  INDEX `idx_guid` (`guid`),
  INDEX `idx_card_last4` (`card_last4`),
  INDEX `idx_billing_email` (`billing_email`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='F1支付方式记录表（Stripe payment_methods）';
