import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppLayout>
      <Header title="Settings" description="Manage your CapaFlow configuration" />
      <div className="p-8">
        <Card>
          <CardContent className="py-16 text-center">
            <Settings className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Settings coming soon</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
