import { CountryIntegrationPage, type CountryConfig } from "@/components/integrations/CountryIntegrationPage";

const config: CountryConfig = {
  countryCode: "ET",
  countryName: "Ethiopia",
  ministryName: "Ministry of Education (የትምህርት ሚኒስቴር)",
  systemAcronym: "MoE EMIS",
  systemFullName: "Federal Ministry of Education EMIS",
  idLabel: "MoE Student ID",
  idColumn: "ethiopia_moe_id",
  language: "Amharic / English (Ethiopian calendar dates accepted)",
  exports: [
    { type: "et_moe_learners", title: "MoE learners list", description: "Per-learner CSV with MoE ID and Ethiopian birth date." },
    { type: "et_enrolment", title: "Enrolment by class & gender", description: "Boys / girls totals per grade." },
    { type: "et_payroll", title: "Payroll & income tax (monthly)", description: "Employee income-tax CSV in ETB.", needsMonth: true },
  ],
};

export default function EthiopiaPage() { return <CountryIntegrationPage config={config} />; }