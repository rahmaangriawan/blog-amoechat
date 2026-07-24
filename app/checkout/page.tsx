import { permanentRedirect } from "next/navigation";
import { SIGNUP_URL } from "@/lib/amoechat-content";

export default function CheckoutPage() {
  permanentRedirect(SIGNUP_URL);
}
