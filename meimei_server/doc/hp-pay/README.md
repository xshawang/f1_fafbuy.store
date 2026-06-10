# 接口說明
1. 對接前請通知我司商務配置相關信息：
	- 聯繫商務提供商戶後台登錄賬號
	- 獲取API位置、商戶ID、密鑰Key
	- 密鑰Key 將於帳號創建 3 天后隱藏
	- 後台登入一律使用 GA 驗證
	**注意：我司首先會開啟測試環境，等測試環境下聯調成功後；商家準備正式上線，請向我司商務申請進入正式的支付環境。 **
1. 對接事項
	- 請求方式（method）：POST
	- 參數類型（content-type）：form-data
	- 異步回調請求方式（method）：POST
	- 異步回調參數類型（content-type）：form-data
	- 字符編碼採用UTF-8編碼
	- 呼叫 API 後返回的數據皆為：JSON
	- 數據皆與銀行直接串接，延遲受銀行端影響，請將 Timeout 設定 5 秒以上
	- **所有參數大小寫敏感**
	- 時間戳目的在於增加數據簽名的不可辨識性，以GMT+7時區，從1970年1月1日據當前時間的秒數 示例: 1586312712
	- 此文檔所列所有參數除特別註明外請全部帶入(空字串也需帶入)
1. 重要說明
	- user_id（實名編號）、user_name（實名）、userip（客端IP），是必要帶入的資料，我方用於比對上分與否的條件
	- userip（客端IP）是用來比對會員的提單 IP 與 開啟收銀台 IP 是否相同的條件，請正確抓取


# 接入說明
1. 會員在 接入平台上面提交充值請求
1. 接入平台的Server端收到請求後生成並保存訂單
1. Server端帶上相應參數傳輸至API，API返回收銀台連結
1. 會員在收銀台完成支付操作
1. 訂單成功後，系統會推送訂單成功結果到接入商戶API
1. 接入商戶API收到推送消息，即可給會員上分

# 數據簽名
目的：為驗證溝通數據是否合法，故需驗明發起數據是否合法、數據內容是否遭串改
步驟：
1. 除sign字段外，所有參數按照字段名的ascii碼從小到大、a到z排序
1. 使用QueryString的格式，即key1=value1&key2=value2…拼接而成，最後拼接上秘鑰Key (&key=XXXXXX)。
1. 利用MD5簽名函數對待簽字符串進行簽名運算
1. 得到簽名結果字符串將其全部轉換為大寫
1. 將數據簽名結果字符串加入參數 sign傳輸

#Demo
```php
$signKey = 'JJ6hT7rPtsHRss2L';
$sendData = array(
    'amount'     => '100500',
    'channel'    => '1012',
    'custom'     => '',
    'notify_url' => 'http://api.pay.test.com/rePay',
    'orderid'    => '20221124104647',
    'return_url' => 'http://api.pay.test.com/home',
    'timestamp'  => 1669258094,
    'uid'        => 'cover',
    'user_id'    => '0987654321',
    'user_name'  => '王小明',
    'userip'     => '1.2.3.4'
);
$dataString = '';

// A -> z
ksort($sendData);

// key = value &
foreach($sendData as $key => $values){
    $dataString .= $key. '='. $values. '&';
}
$dataString .= 'key='. $signKey;

// amount=100500&channel=1012&custom=¬ify_url=http://api.pay.test.com/rePay&orderid=20221124104647&return_url=http://api.pay.test.com/home×tamp=1669258094&uid=cover&user_id=0987654321&user_name=王小明&userip=1.2.3.4&key=JJ6hT7rPtsHRss2L
echo $dataString. '<br>';

$sign = strtoupper(md5($dataString));

// BEA41D7CBC606605B59481FF989B67B3
echo $sign. '<br>';

$sendData['sign'] = $sign;

// amount     => 100500
// channel    => 1012
// custom     =>
// notify_url => http://api.pay.test.com/rePay
// orderid    => 20221124104647
// return_url => http://api.pay.test.com/home
// timestamp  => 1669258094
// uid        => cover
// userip     => 1.2.3.4
// user_id    => 0987654321,
// user_name  => 王小明,
// sign       => BEA41D7CBC606605B59481FF989B67B3
foreach($sendData as $key => $values){
    echo $key. ' => '. $values. '<br>';
}

// Complete
exit();
```



#特別注意
1. **參與簽名的參數與最終傳輸的參數必須完全一致**
1. **所有傳輸的資料都必須列入簽名行列**
1. **空參數亦要加入簽名。 **
1. **字串前後請勿含有空白、斷行、分行等符號**
1. **請勿將簽名後的參數做任何編碼（utf8、urlEncode...），這將導致Server端接收資料不一致**
1. **返回的 result 其 Json 請勿解開，請在維持 Json string 的狀態下進行簽名運算。 **
1. **若有疑問，請提交客服查詢，查詢請附上：簽名前參數 與 傳送時的參數，以利比對**