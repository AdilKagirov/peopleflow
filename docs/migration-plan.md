# Future Migration From Old E-Staff

The old E-Staff database is not required to build KMF PeopleFlow now. When access is available, migration should be handled as a separate project phase.

## Required Inputs Later

One of the following is enough to start migration analysis:

- database dump;
- read-only database access;
- CSV/Excel exports;
- API documentation;
- sample exports for vacancies, candidates, resumes, and applications.

## Migration Steps

1. Inventory legacy data
   - tables;
   - fields;
   - row counts;
   - file storage;
   - encodings and date formats.

2. Create staging tables
   - keep raw imported data;
   - do not transform during initial load;
   - preserve legacy IDs.

3. Map legacy data
   - old vacancy -> vacancies;
   - old candidate/person -> candidates;
   - old response/application -> applications;
   - old stage/status -> pipeline stages and history;
   - old notes/emails -> communications and notes;
   - old files -> attachments and resumes.

4. Validate
   - row counts;
   - required fields;
   - duplicate candidates;
   - broken references;
   - missing files.

5. Import to production tables
   - run idempotent scripts;
   - save legacy IDs in staging cross-reference tables;
   - record audit/import logs.

6. Business acceptance
   - HR checks random candidates;
   - recruiters check active vacancies;
   - reports compare old and new counts.

## Recommended Staging Tables

```text
legacy_candidates_raw
legacy_vacancies_raw
legacy_applications_raw
legacy_communications_raw
legacy_attachments_raw
legacy_id_map
legacy_import_runs
```

These are intentionally not included in the main schema yet, because their exact fields depend on the old E-Staff export.

