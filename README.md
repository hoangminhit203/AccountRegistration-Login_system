# Node.js Authentication App

## Mô tả

Ứng dụng web xác thực người dùng sử dụng Node.js, Express, MongoDB, EJS, bcrypt và Nodemailer. Hỗ trợ đăng ký, kích hoạt tài khoản qua email, đăng nhập, bảo vệ trang, giao diện hiện đại.

## Yêu cầu hệ thống

- Node.js >= 14
- MongoDB local (mặc định chạy trên mongodb://localhost:27017/Login)

## Cài đặt

1. Clone hoặc tải mã nguồn về máy.
2. Cài đặt các package:
   ```bash
   npm install
   ```
3. Cài đặt MongoDB và đảm bảo đã chạy trên máy local.
4. Tạo file cấu hình email (nếu muốn dùng email thật):
   - Sửa thông tin user, pass trong `src/index.js` phần cấu hình Nodemailer.
   - Nếu dùng Gmail, cần bật xác thực 2 bước và tạo App Password.

## Chạy ứng dụng

```bash
node src/index.js
```

- Server mặc định chạy ở http://localhost:5000

## Sử dụng

- Truy cập http://localhost:5000 để đăng nhập hoặc đăng ký tài khoản mới.
- Sau khi đăng ký, kiểm tra email để kích hoạt tài khoản.
- Đăng nhập thành công sẽ chuyển sang trang Home.

## Ghi chú

- Nếu đổi port MongoDB hoặc muốn dùng cloud MongoDB, sửa chuỗi kết nối trong `src/config.js`.
- Nếu gặp lỗi gửi mail, kiểm tra lại cấu hình email và quyền truy cập ứng dụng của Google.

---

by TRI
