import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { anonymousPrincipal, canAccess, loginPreviewUrl } from "@/lib/access-policy";
import type { AccessPolicy } from "@/types";

export function AccessNotice({ policy,returnTo,compact = false }: { policy:AccessPolicy; returnTo:string; compact?:boolean }) {
  if (canAccess(anonymousPrincipal,policy)) return null;
  return <div className={"access-notice " + (compact ? "is-compact" : "")}><LockKeyhole size={compact ? 15 : 24} strokeWidth={1.4} /><div><strong>{policy === "staff" ? "Nghiệp vụ dành cho tài khoản được phân quyền" : "Thông tin cá nhân cần đăng nhập"}</strong><p>{policy === "staff" ? "Cần quyền cán bộ Đoàn – Hội hoặc quản trị viên." : "Chỉ tài khoản có quyền phù hợp mới được xem hồ sơ cá nhân."} {compact ? "" : "Bản frontend chưa kết nối xác thực; không có dữ liệu hoặc thao tác nội bộ được cung cấp."}</p>{!compact && <Link href={loginPreviewUrl(returnTo)} className="journey-text-link">Xem giao diện đăng nhập <ArrowRight size={14} /></Link>}</div></div>;
}
