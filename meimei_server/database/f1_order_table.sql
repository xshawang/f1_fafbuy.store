-- F1订单表
CREATE TABLE IF NOT EXISTS `f1_order` (
  `f1_order_id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单ID（主键）',
  `f1_name` varchar(200) NOT NULL COMMENT 'F1名称',
  `f1_title` varchar(500) NOT NULL COMMENT 'F1标题',
  `f1_quarty` varchar(50) NOT NULL COMMENT 'F1季度',
  `f1_money` bigint NOT NULL COMMENT 'F1金额（分）',
  `id` varchar(100) NOT NULL COMMENT '关联ID',
  `order_status` tinyint NOT NULL DEFAULT 0 COMMENT '订单状态：0-待处理 1-已处理 2-已完成 3-已取消',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '是否删除：0-否 1-是',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` varchar(30) NOT NULL DEFAULT '' COMMENT '创建人',
  `update_by` varchar(30) NOT NULL DEFAULT '' COMMENT '更新人',
  `remark` varchar(255) NOT NULL DEFAULT '' COMMENT '备注',
  `version` int NOT NULL DEFAULT 0 COMMENT '版本号',
  PRIMARY KEY (`f1_order_id`),
  KEY `idx_f1_name` (`f1_name`),
  KEY `idx_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='F1订单表';
