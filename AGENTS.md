
- In-app PDF downloads go through the `download-document` edge function and `downloadDocument()` (bytes saved via blob), never by opening Storage signed links — ad blockers block `/storage/v1/object/sign/` URLs. Emailed receipts attach the PDF directly, since email clients are not affected.
