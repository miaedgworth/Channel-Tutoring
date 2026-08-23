import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { CourseForm } from "@/components/admin/course-form";

export const metadata: Metadata = { title: "New Course" };

export default function NewCoursePage() {
  return (
    <Card className="max-w-3xl">
      <CardContent>
        <CourseForm />
      </CardContent>
    </Card>
  );
}
