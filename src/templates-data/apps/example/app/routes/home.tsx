import type { Route } from "./+types/home";
import DashboardPage from "~/dashboard/page";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Dashboard | Despace" },
    { name: "description", content: "Modern dashboard showcasing UI components" },
  ];
}

export default function Home() {
  return (
    <DashboardPage />
  );
}
