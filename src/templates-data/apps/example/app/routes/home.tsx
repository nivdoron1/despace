import type { Route } from "./+types/home";
import { useState } from "react";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  List,
  ListItem,
  MultiSelect,
  Graph,
  Toaster,
  toast
} from "ui";
import { Login, Register } from "@templates-data/supabase-auth";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "UI Components Showcase" },
    { name: "description", content: "Showcase of UI and Auth components" },
  ];
}

export default function Home() {
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);

  const graphData = [
    { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
  ];

  const frameworks = [
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "angular", label: "Angular" },
    { value: "svelte", label: "Svelte" },
  ];

  return (
    <div className="container mx-auto p-8 space-y-12">
      <Toaster />

      <section className="space-y-4">
        <h1 className="text-4xl font-bold">UI Components Showcase</h1>
        <p className="text-muted-foreground">Demonstrating the shared UI library and Auth components.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Auth Components */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Authentication</h2>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Login Component</CardTitle>
              </CardHeader>
              <CardContent>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Register Component</CardTitle>
              </CardHeader>
              <CardContent>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* UI Components */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">UI Elements</h2>

          <Card>
            <CardHeader>
              <CardTitle>Basic Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" placeholder="Email" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => toast.success("Button clicked!")}>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rich Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>MultiSelect</Label>
                <MultiSelect
                  options={frameworks}
                  selected={selectedFrameworks}
                  onChange={setSelectedFrameworks}
                  placeholder="Select frameworks..."
                />
              </div>

              <div className="space-y-2">
                <Label>List</Label>
                <List>
                  <ListItem>First item in the list</ListItem>
                  <ListItem>Second item in the list</ListItem>
                  <ListItem>Third item in the list</ListItem>
                </List>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <Graph
                data={graphData}
                lines={[
                  { key: 'uv', color: '#8884d8', name: 'UV' },
                  { key: 'pv', color: '#82ca9d', name: 'PV' }
                ]}
                height={250}
              />
            </CardContent>
          </Card>

        </section>
      </div>
    </div>
  );
}
