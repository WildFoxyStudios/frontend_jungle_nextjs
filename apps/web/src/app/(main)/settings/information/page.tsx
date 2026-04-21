"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Label } from "@jungle/ui";
import { usersApi } from "@jungle/api-client";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function InformationPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<string[]>([
    "my_information", "posts", "pages", "groups", "followers", "following", "friends"
  ]);

  const dataTypes = [
    { id: "my_information", label: "My Information" },
    { id: "posts", label: "Posts" },
    { id: "pages", label: "Pages" },
    { id: "groups", label: "Groups" },
    { id: "followers", label: "Followers" },
    { id: "following", label: "Following" },
    { id: "friends", label: "Friends" },
  ];

  const toggleData = (id: string) => {
    setSelectedData((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDownload = async () => {
    if (selectedData.length === 0) {
      toast.error("Please select at least one data type");
      return;
    }
    setLoading(true);
    try {
      const response = await usersApi.downloadMyInfo(selectedData);
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `my-jungle-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data export ready!");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Information</CardTitle>
          <CardDescription>
            Download a copy of your information that you've shared on Jungle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataTypes.map((dt) => (
              <div key={dt.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => toggleData(dt.id)}>
                <Checkbox id={dt.id} checked={selectedData.includes(dt.id)} />
                <Label htmlFor={dt.id} className="cursor-pointer">{dt.label}</Label>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleDownload} disabled={loading} className="gap-2">
              {loading ? tc("loading") : (
                <>
                  <Download className="h-4 w-4" />
                  Download My Info
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>GDPR Compliance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          In accordance with the General Data Protection Regulation (GDPR), you have the right to request a portable copy of your personal data. The generated file includes your profile details, activity counts, and social connections.
          <br /><br />
          If you wish to permanently delete your data, please use the <strong>Delete Account</strong> section.
        </CardContent>
      </Card>
    </div>
  );
}
