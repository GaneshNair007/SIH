import { redirect } from "next/navigation";

/** Redirect old /pipeline URL to the canonical /working page */
export default function PipelineRedirect() {
  redirect("/working");
}
