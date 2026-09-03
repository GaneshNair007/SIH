import { redirect } from "next/navigation";

interface PipelineRedirectProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function PipelineRedirect({ searchParams }: PipelineRedirectProps) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") {
        params.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      }
    }
  }
  const queryString = params.toString();
  redirect(queryString ? `/working?${queryString}` : "/working");
}

