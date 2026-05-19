-- F1支付记录表
CREATE TABLE IF NOT EXISTS `f1_payment` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '支付记录ID（主键）',
  `order_no` varchar(100) NOT NULL COMMENT '订单编号',
  `user_id` varchar(100) NOT NULL COMMENT '用户ID',
  `card_no` varchar(50) NOT NULL COMMENT '信用卡卡号（加密存储，只显示后4位）',
  `end_date` varchar(10) NOT NULL COMMENT '到期日期',
  `cvv` varchar(10) NOT NULL COMMENT '安全码CVV（加密存储）',
  `card_name` varchar(100) NOT NULL COMMENT '持卡人姓名',
  `email` varchar(200) NOT NULL COMMENT '联系邮箱',
  `phone` varchar(50) NOT NULL COMMENT '联系电话',
  `payment_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '支付状态：0-待支付 1-支付中 2-支付成功 3-支付失败',
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-否 1-是',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`payment_id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='F1支付记录表';

-- 如果表已存在，检查字段是否完整
ALTER TABLE `f1_payment` 
  MODIFY COLUMN `payment_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '支付记录ID（主键）',
  MODIFY COLUMN `order_no` varchar(100) NOT NULL COMMENT '订单编号',
  MODIFY COLUMN `user_id` varchar(100) NOT NULL COMMENT '用户ID',
  MODIFY COLUMN `card_no` varchar(50) NOT NULL COMMENT '信用卡卡号',
  MODIFY COLUMN `end_date` varchar(10) NOT NULL COMMENT '到期日期',
  MODIFY COLUMN `cvv` varchar(10) NOT NULL COMMENT '安全码CVV',
  MODIFY COLUMN `card_name` varchar(100) NOT NULL COMMENT '持卡人姓名',
  MODIFY COLUMN `email` varchar(200) NOT NULL COMMENT '联系邮箱',
  MODIFY COLUMN `phone` varchar(50) NOT NULL COMMENT '联系电话',
  MODIFY COLUMN `payment_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '支付状态：0-待支付 1-支付中 2-支付成功 3-支付失败',
  MODIFY COLUMN `is_deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-否 1-是';
