"use client";

import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function LoginPreview() {
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return <form className="login-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); event.currentTarget.reset(); }}><span className="demo-label">GIAO DIỆN XEM TRƯỚC</span><h2>Chào bạn trở lại.</h2><p>Mang theo sự tò mò.<br />Phần còn lại, mình cùng khám phá.</p><label htmlFor="email">Email sinh viên</label><input id="email" type="email" placeholder="ban@example.com" autoComplete="off" required /><label htmlFor="password">Mật khẩu</label><div className="password-field"><input id="password" type={visible ? "text" : "password"} placeholder="Nhập mật khẩu minh họa" autoComplete="off" minLength={6} required /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><button type="submit" className="primary-button">Xem trước đăng nhập<ArrowRight size={17} /></button>{submitted && <div className="login-notice" role="status">Đây là bản xem trước. Chức năng đăng nhập sẽ được kết nối với ASP.NET Core trong giai đoạn sau. Chưa có phiên đăng nhập được tạo.</div>}<p className="login-privacy">Chỉ dùng dữ liệu minh họa. Biểu mẫu này không gửi hoặc lưu thông tin.</p></form>;
}
