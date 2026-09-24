import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { CourseTermsContent } from "@/components/legal/course-terms-content";
import { COURSE_TERMS_VERSION } from "@/lib/constants";

export const metadata: Metadata = { title: "Course Terms & Conditions" };

export default function CourseTermsPage() {
  return (
    <LegalPage title="Course Terms &amp; Conditions" lastUpdated={COURSE_TERMS_VERSION}>
      <CourseTermsContent />
    </LegalPage>
  );
}
