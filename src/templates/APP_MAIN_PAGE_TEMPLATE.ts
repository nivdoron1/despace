export const APP_MAIN_PAGE_TEMPLATE = `'use client';

import * as React from "react"
import {
    IconCamera,
    IconChartBar,
    IconDashboard,
    IconDatabase,
    IconFileAi,
    IconFileDescription,
    IconFileWord,
    IconFolder,
    IconHelp,
    IconInnerShadowTop,
    IconListDetails,
    IconReport,
    IconSearch,
    IconSettings,
    IconUsers,
} from "@tabler/icons-react"
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  NavMain,
  NavDocuments,
  NavSecondary,
  SidebarFooter,
  NavUser,
  SidebarInset,
  SidebarProvider,
  SiteHeader,
  SectionCards,
  ChartAreaInteractive,
  DataTable
} from "@WORKSPACE_NAME_PLACEHOLDER@/ui"

const tableData = [
    {
        "id": 1,
        "header": "Cover page",
        "type": "Cover page",
        "status": "In Process",
        "target": "18",
        "limit": "5",
        "reviewer": "Eddie Lake"
    },
    {
        "id": 2,
        "header": "Table of contents",
        "type": "Table of contents",
        "status": "Done",
        "target": "29",
        "limit": "24",
        "reviewer": "Eddie Lake"
    },
    {
        "id": 3,
        "header": "Executive summary",
        "type": "Narrative",
        "status": "Done",
        "target": "10",
        "limit": "13",
        "reviewer": "Eddie Lake"
    },
    {
        "id": 4,
        "header": "Technical approach",
        "type": "Narrative",
        "status": "Done",
        "target": "27",
        "limit": "23",
        "reviewer": "Jamik Tashpulatov"
    },
    {
        "id": 5,
        "header": "Design",
        "type": "Narrative",
        "status": "In Process",
        "target": "2",
        "limit": "16",
        "reviewer": "Jamik Tashpulatov"
    }
]

const sidebarData = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "#",
            icon: IconDashboard,
        },
        {
            title: "Lifecycle",
            url: "#",
            icon: IconListDetails,
        },
        {
            title: "Analytics",
            url: "#",
            icon: IconChartBar,
        },
        {
            title: "Projects",
            url: "#",
            icon: IconFolder,
        },
        {
            title: "Team",
            url: "#",
            icon: IconUsers,
        },
    ],
    navClouds: [
        {
            title: "Capture",
            icon: IconCamera,
            isActive: true,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
        {
            title: "Proposal",
            icon: IconFileDescription,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
        {
            title: "Prompts",
            icon: IconFileAi,
            url: "#",
            items: [
                {
                    title: "Active Proposals",
                    url: "#",
                },
                {
                    title: "Archived",
                    url: "#",
                },
            ],
        },
    ],
    navSecondary: [
        {
            title: "Settings",
            url: "#",
            icon: IconSettings,
        },
        {
            title: "Get Help",
            url: "#",
            icon: IconHelp,
            
        },
        {
            title: "Search",
            url: "#",
            icon: IconSearch,
        },
    ],
    documents: [
        {
            name: "Data Library",
            url: "#",
            icon: IconDatabase,
        },
        {
            name: "Reports",
            url: "#",
            icon: IconReport,
        },
        {
            name: "Word Assistant",
            url: "#",
            icon: IconFileWord,
        },
    ],
}

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <a href="#">
                                <IconInnerShadowTop className="!size-5" />
                                <span className="text-base font-semibold">Acme Inc.</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={sidebarData.navMain} />
                <NavDocuments items={sidebarData.documents} />
                <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={sidebarData.user} />
            </SidebarFooter>
        </Sidebar>
    )
}

export default function DashboardPage() {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <SectionCards />
                            <div className="px-4 lg:px-6">
                                <ChartAreaInteractive />
                            </div>
                            <DataTable data={tableData} />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
`;
