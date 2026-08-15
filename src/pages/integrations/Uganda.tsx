import { CountryIntegrationPage, type CountryConfig } from "@/components/integrations/CountryIntegrationPage";
import { ResultsImportCard } from "@/components/integrations/ResultsImportCard";

const config: CountryConfig = {
  countryCode: "UG",
  countryName: "Uganda",
  ministryName: "Ministry of Education and Sports",
  systemAcronym: "EMIS / UNEB",
  systemFullName: "Education Management Information System & Uganda National Examinations Board",
  idLabel: "LIN",
  idColumn: "uganda_lin",
  exports: [
    { type: "ug_emis_learners", title: "EMIS learners list", description: "Per-learner CSV with LIN, UNEB index, demographics." },
    { type: "ug_enrolment", title: "Enrolment by class & gender", description: "Boys / girls totals per grade for MoES returns." },
    { type: "ug_uneb_registration", title: "UNEB candidate registration", description: "PLE / UCE / UACE registration file.", needsGrade: ["P7", "S4", "S6"] },
    { type: "ug_ura_paye", title: "URA PAYE (monthly)", description: "Uganda Revenue Authority PAYE return.", needsMonth: true },
  ],
};

export default function UgandaPage() {
  return (
    <CountryIntegrationPage
      config={config}
      extra={
        <ResultsImportCard
          fn="uneb-results-import"
          boardName="UNEB"
          indexLabel="UNEB index number"
          description="Upload the PLE / UCE / UACE results CSV released by UNEB and match candidates to learner records."
        />
      }
    />
  );
}