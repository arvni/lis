# LIS — Code Improvement Plan

Findings from a codebase review on 2026-06-21, with a prioritized work list.
Each item below maps to a tracked task; check items off as they land.

## Summary of findings

| # | Area | Severity | Effort |
|---|------|----------|--------|
| 1 | PHPStan baseline masking 1,608 suppressed errors | High | High |
| 2 | 31 controllers contain raw query logic (layering violation) | High | Medium |
| 3 | Adapter pattern under-applied — cross-domain Model coupling | Medium | High |
| 4 | Thin/lopsided test coverage (89 tests, only 3 unit) | High | Medium |
| 5 | Oversized frontend components (Drawing.jsx 2,292 LOC, etc.) | Medium | High |
| 6 | `console.log` leftovers in `.jsx` + no `no-console` lint rule | Low | Low |

---

### 1. PHPStan baseline (`phpstan-baseline.neon`, 383 KB / 1,608 entries)
Breakdown of suppressed errors:
- **425** "no type specified" → missing array/iterable generics on return/param types.
- **357** "Access to an undefined property" → missing `@property` docblocks on Eloquent models.
- **25** "Call to an undefined method" → **audit individually**; some may be genuine latent bugs.
- Remainder: template-type resolution, `expects` mismatches.

CLAUDE.md rule: *fix, don't append to baseline.* Plan: add `@property`/`@method`
docblocks to models (clears the bulk of the 357 + 25), then add generics to
repository/service signatures. Re-run `composer analyse` and shrink the baseline.

### 2. Controllers with raw query logic (31 of 197)
CLAUDE.md: *Controller → Service → Repository → Model; controllers must not write raw queries.*
Reference offender: `app/Http/Controllers/Inventory/ExpiryDashboardController.php`
(builds `StockLot` queries inline, uses raw `Request`, returns raw Eloquent models via
`compact()` instead of Resources). Refactor this one first as a template, then sweep the rest.

### 3. Adapter coverage
Only `Billing` and `Reception` have `Adapters/` across 15 domains. Domain Models reference
other domains' Models directly (e.g. `Laboratory\Models\Method` → `Reception\Models\AcceptanceItem`).
Formalize the hot Laboratory↔Reception boundaries through Adapters where practical.

### 4. Test coverage
89 tests for 77 services + 197 controllers; only 3 unit tests. Untested/thin domains:
Document, Setting, System, Console. Prioritize unit tests around the riskiest logic:
`AcceptanceService` (953 LOC), `ReportService` (804), `AcceptanceItemConversionService`,
`ReferrerOrderService`.

### 5. Oversized frontend components
`Drawing.jsx` (2,292), `Import/Create.jsx` (1,689), `AddTestOrPanel.jsx` (1,688), and several
1,000+ LOC pages. Decompose into subcomponents; memoize hot paths.

### 6. `console.log` cleanup
10 `console.log` calls remain in `.jsx`. Remove them and add a `no-console` ESLint rule
(allow `warn`/`error`) to prevent regressions.

---

## Progress log
- [x] 1. Audit & shrink PHPStan baseline — ✅ audited 25 "undefined method" entries; fixed **3 real latent bugs** (Doctor/Referrer delete guards, WelcomeNotification mail recipient) + removed those 3 baseline entries.
      ✅ 2026-06-22 risk audit + dead-code/docblock slice (baseline **1576 → 1499**, −77; `composer analyse` green):
        • Audited the remaining **21 `method.notFound`** entries — **all false positives, no bugs**: trait scopes
          (`Searchable::scopeSearch`, `Test::scopeActive` called via untyped closures), polymorphic `tags()`
          MorphToMany, `getRoleNames`/`canBeActedBy`/`notify` trait methods on `Model`-typed vars,
          SoftDeletes `withTrashed`/`onlyTrashed` on `HasMany`, `relationLoaded` via `JsonResource::__call`,
          and Twilio `messages()`/`toWhatsApp()` (SDK magic `__call` + guarded by `method_exists`).
        • Fixed real dead code: `Searchable::parseArguments` had `return …; break;` in a switch — the unreachable
          `break`s were reported as `deadCode.unreachable` once per using-model → removing them cleared **33** entries
          (incl. one genuinely-masked instance: `PatientRepository::countPatients` had the same pattern, a real
          unreachable-code smell the baseline was hiding — fixed at source).
        • Resource property/method resolution via `@mixin <Model>`: added to TestResource, MethodResource,
          ReferrerTestResource, DocumentResource, OrderMaterialResource, UserResource, StatementResource → cleared
          their `property.notFound` + `relationLoaded` entries (~44). This surfaced two real doc issues fixed in place:
          `MethodResource::resolvePriceType` `@return string|null` was wrong (it returns the `MethodPriceType` enum) →
          corrected. NOTE: `@mixin` was **reverted on AcceptanceItemStateResource** — there it resolved `$this->sample`
          but exposed `$this->sample->barcode` as base-`Model` cascades (untyped `sample()` relation); left baselined
          (cascade not worth it for one resource). SectionOptionResource left baselined (wraps an ad-hoc shape).
        Method to remove only truly-obsolete entries: `vendor/bin/phpstan analyse --error-format=json` → parse the
        `ignore.unmatched` messages (the human formatter wraps long lines mid-token and corrupts naive parsing) →
        delete exactly those blocks by (message, identifier, path).
      ✅ 2026-06-22 scalar-attribute @property slice (baseline **1499 → 1492**, −7; analyse green): typed the
        runtime-computed *scalar* dynamic attributes only — `Invoice::$invoiceNo`/`$has_different_owner`,
        `Test::$withDefaultReferrerPrice` (also resolves the TestResource access via its `@mixin Test`),
        `Patient::$consultations_count`/`$invoices_count`/`$payments_count` (withCount ints).
      FINDING (why concrete-model relation docblocks are NOT chunkable): tried `@property-read` on AcceptanceItem
        (12 entries) — cleared 25 but introduced **15 net-new errors** cascading down the relation graph
        (AcceptanceItem→MethodTest→{Method,Test}→Workflow→Section…). Verified none of those next-level accesses
        (`Section::$name`, `Method::*`, `Workflow::$sections`, `Test::*`) are baselined → they're error-free only
        because the parent is `mixed`; typing one model creates new errors faster than it clears old ones.
        Reverted. Relation+column typing must be ONE domain-wide pass (proper Larastan model setup), not per-model.
      ✅ 2026-06-23 safe `missingType.*` slice, batch 1 (baseline **1492 → 1325**, −167; `composer analyse` green +
        full suite 577/1375 green). Typed only NON-model signatures (scalars/arrays/`void`/`mixed`/`Builder<Model>` via
        docblock/`iterable`); DEFERRED every model-typed param + concrete-model return (they cascade into the relation
        graph — that's the model pass). Cleared: Setting repo; all 7 `*DocumentUpdateEvent` classes; all 22 DTOs
        (`toArray(): array`, `fromRequest(array)`); Exports (safe non-model formatters/`styles(): array`/`Collection`
        only); the mechanical tail (Adapters, SectionPermissionsListener, Console `handle(): void`, FormRequest
        `authorize(): bool`, Jobs, Twilio channels, Rules, Utils); and the whole Referrer domain repos+services.
        Two latent bugs fixed (typing surfaced them): (a) `Setting` model never used `Searchable` yet the repo called
        `$query->search()` → BadMethodCallException on any search filter; added the trait + corrected the searched
        column `name`→`title` (no `name` column exists). (b) `StoreReferrerOrderPatientController` dispatched
        `PatientDocumentUpdateEvent` with the bare `DocumentTag::DOCUMENT` enum instead of `->value` (every other call
        site passes the string). Also fixed one regression I introduced and caught with the full suite: `$ownerId` is
        legitimately nullable (`ReportService` dispatches `$report?->...?->patient?->id`) → widened the 3
        originally-untyped-property events (Patient/User/Consultant) to `int|string|null`.
        GOTCHAS for next batch: • `$query->search()` needs a `Builder<ConcreteModel>` docblock generic — bare `Builder`
          is `Builder<Model>` and won't resolve the trait scope; the model must `use Searchable`. • `whereHas('rel',
          fn($q) => $q->search())` CASCADES once the OUTER query is typed (inner `$q` becomes `Builder<Model>`,
          scope unresolved) → leave those `applyFilters` deferred (CollectRequest, ReferrerTest, OrderMaterial[+no
          searchable column = its own latent bug, left as-is]). • concrete-model returns cascade via PHPStan INFERENCE
          even after you revert the declaration (`->first()` infers `?Model`) — so once you strip such an entry you must
          RESTORE it to defer (did this for `MaterialRepository::getByBarcode`). • static analysis does NOT catch runtime
          nullability — always run the full suite. Method/tooling: `/tmp/sync_baseline.php` runs
          `phpstan analyse --error-format=json`, prints any NEW errors (a cascade → fix or revert, strips nothing) and
          otherwise auto-removes exactly the now-`ignore.unmatched` baseline blocks.
      ✅ 2026-06-23 safe `missingType.*` slice, batch 2 (PR #54; baseline **1325 → 1084**, −241; analyse green +
        suite 577/1375 green). Same non-model-only rules. Covered: Setting/Document/Consultation/User/Notification/
        Inventory repos+services; ALL Billing repos+services (Invoice/Payment/Statement query helpers + finders +
        paginator/collection returns, dashboard `Query\Builder`/`Support\Collection` returns, events typed `int`);
        ALL Laboratory repos (14 `applyFilters` as `Builder<Model>` + finders) + services; ALL Reception repos+
        services+events+notification (params, `Support\Collection` for report-shaping helpers, event ctor params).
        More latent bugs/nullability surfaced: `findAcceptanceItemById` is called with null id for unsaved items →
        widened `int|string|null`; `WorkflowService::getPrevSections` returns Collection (a unit test used a string
        sentinel → switched to a real Collection). NEW GOTCHA confirmed at scale: declaring a bare Eloquent
        `Collection` return WIDENS elements to base `Model` (worse than the inferred `Collection<int,Concrete>`) and
        cascades at call sites → defer those returns. Also `applyFilters` with `whereHas('rel')` or `$query->active($x)`
        cascades once `$query` is `Builder<Model>` because the relation/scope methods on the model are untyped
        (deferred): Reception (all), Laboratory ConsentForm/Instruction/SectionGroup/Section/Offer/ReportTemplateParameter,
        Billing InvoiceRepository::applyQuery+listReferrer, Consultation/OrderMaterial (own search latent bugs).
      ✅ 2026-06-23 controller return types, batch 3 (PR #55; baseline **1084 → 962**, −122; analyse green + suite
        577/1375 green). Typed 121 controller action methods + 1 route-param string via a conservative classifier
        (/tmp/classify_controllers.php): reads each method's `return` expressions and only types single-kind/known-union
        methods — inertia→`\Inertia\Response`, back/redirect/to_route→`RedirectResponse`, `->json()`→`JsonResponse`,
        `::collection()`→`AnonymousResourceCollection`, `new XResource()`→`JsonResource`. Controller return types DON'T
        cascade (framework invokes them); analyse validates them. Deferred: opaque returns (service passthrough,
        `BinaryFileResponse` downloads, fall-through-without-return), and `handlePoolingAcceptance($user)` (`$user->name`
        on untyped User model).
      ✅ 2026-06-24 domain-wide RELATION typing pass (baseline **962 → 595**, −367; `composer analyse` green + full
        suite 577/1375 green). The coordinated relation-layer slice of the model pass, applied to all 83 models AT ONCE
        (the only way it works — typing one model's relations exposes the next model's untyped ones; doing all in one
        shot lets the chain resolve). Tooling `/tmp/type_relations.php` (nikic/php-parser, SURGICAL string edits — no
        file reprint): for every relation accessor it (a) adds the native return type (`: HasMany` etc., 145 added) and
        (b) adds a GENERIC `@return Rel<Related, $this>` docblock (303 added; 3-param `<Related, Through, $this>` for
        hasManyThrough/hasOneThrough; morphTo left bare = polymorphic Model). Related/through class read from the first
        `X::class` arg in the body. CRITICAL GOTCHA that drove the design: a BARE native return type (`: HasMany` with
        no generic) is WORSE than no type — Larastan then resolves `$model->relation` property access as base
        `HasMany<Model>` → base `Model`, re-introducing `property.notFound`. The generic docblock is what makes property
        access resolve to the concrete related model. So the pass MUST add the generic, not just the native type.
        Cleared exactly where expected: property.notFound 295→83, larastan.relationExistence 54→1, missingType.return
        289→142 (relation methods now typed), argument.type 38→14; base-`Model::$x` access 198→57. Hand-typed 2
        relation-DERIVED methods the AST tool correctly skipped (they chain off another relation accessor, not a
        primitive): SectionGroup::recursiveChildren (`children()->with(...)` → HasMany), AcceptanceItem::activeSamples
        (`samples()->wherePivot(...)` → BelongsToMany). Added Section `@property-read int|null $*_items_count` for the
        SectionGroupService withCount() aggregate aliases. RUNTIME fallout (all test-only, production correct — analyse
        validates the return types): native relation return types break the Mockery delete-guard pattern — a partial
        mock stubbing a typed relation must return a correctly-typed relation mock (`Mockery::mock(HasMany::class)`),
        not a bare `Mockery::mock()` (TypeError: "Return value must be of type HasMany"). Fixed 19 such failures across
        10 *ServiceTest files (the relation type per site comes straight from the TypeError message). TOOLING TRAP for
        the baseline diff: `phpstan --generate-baseline=FILE` writes paths RELATIVE TO FILE'S DIR and, if FILE differs
        from the included baseline, the OLD baseline still suppresses everything so the new file only holds the delta —
        generate INTO the real `phpstan-baseline.neon` (project root) for the true count + matching relative paths.
        Did NOT run Pint: it would whole-file-reformat 70+ pre-existing-noisy models (CI doesn't run Pint anyway); my
        surgical edits add only typed signatures/docblocks/used imports.
      ✅ 2026-06-24 column `@property` pass via ide-helper:models (baseline **595 → 594**; `composer analyse` green +
        Reception state/workflow/conversion/report-flow suites 35/35 green). Installed `barryvdh/laravel-ide-helper`
        (--dev; `composer audit` clean), generated docblocks from the live schema (`ide-helper:models --nowrite`), then a
        custom injector (`/tmp/inject_properties.php`) merged **only the column `@property` lines** into all 82 models
        (832 lines) — deliberately SKIPPING `@property-read` relations (already resolved by the merged relation pass's
        method `@return Rel<Related,$this>` generics — re-adding them risks the same cascade) and `@method` query-builder
        noise. Preserves existing/hand-added `@property` by var name.
        KEY FINDING (reorders the rest of #1): the column `@property` pass on its own clears almost NOTHING — net −1
        entry. The `property.notFound` bulk sits on **base-`Model`-typed variables** (untyped repository / `->first()`
        returns), and a concrete-class `@property` only resolves access once the *variable* is typed to that concrete
        class. So `@property` is a PREREQUISITE that pays off only after the missingType.return/parameter slice lands —
        the two must go together (or returns first). The 4 "new" `nullsafe.neverNull` entries were not regressions, just
        the same baselined entries with the message type renamed `Carbon\Carbon` → `Illuminate\Support\Carbon` (now
        explicit). Real wins: cleared `TestResource::resolvePrice()` return.type, and fixed one latent bug typing
        surfaced — `AcceptanceItemState::$is_first_section` is a tinyint(1) with no cast passed into the DTO's
        `bool $isFirstSection` (relied on loose int→bool coercion) → added the `'bool'` cast. Did NOT run Pint (models
        are pre-existing-noisy; CI doesn't run Pint; edits are docblock-only + one cast).
      ✅ 2026-06-24 scope typing + first concrete-model return/param clusters (baseline **500 → 413**, −87; `composer
        analyse` green + full suite 577/1375 green). Two halves:
        (A) MECHANICAL — typed all 31 model `scope*` methods via `/tmp/type_scopes.php` (AST, surgical): `Builder $query`
          param + `: Builder` return + `@param/@return Builder<ConcreteModel>` generics (so `Model::active()->first()`
          resolves to the concrete model). `scopeIsTest` (no return) → `: void` (Laravel returns the builder by reference;
          Larastan's scope extension resolves `Model::isTest()` as `Builder<Model>` regardless of the declared void).
          EXCLUDED `scopeSearch` (Report/ReferrerOrder) — cascade-prone: its inner `whereHas(...,fn($q)=>$q->search())`
          calls the Searchable trait scope on closure-typed `Builder<Related>` → defer with the other `applyFilters`
          search cascades. Hand-typed `scopeIsResearch`'s `bool $isResearch`. Cleared 31 return + 32 param, ZERO cascade.
        (B) KEY MECHANISM CONFIRMED — scope returns clear `missingType.*` but **zero `property.notFound`**: the
          `property.notFound` bulk does NOT sit behind scope/finder chains, it sits on base-`Model` vars produced by
          (i) untyped helper PARAMS that do `$param->column`, and (ii) **bare `Collection` returns** (a bare `: Collection`
          is `Collection<Model>` → widens elements to base `Model`). Typing those — now SAFE post-`@property` groundwork,
          was deferred before it — clears the downstream column access AND cascades POSITIVELY to consumers. Cleared
          per-cluster (19 `property.notFound`): • PatientRepository `findPatientByIdNo(): ?Patient`,
          `listPatient(): LengthAwarePaginator<int,Patient>`, `applyFilters(Builder<Patient>): void`.
          • StockMutationService `generateBarcode(StockTransactionLine $line)` + StockLotRepository
          `activeFifoLots(): Collection<int,StockLot>` generic → cleared 10 across the service AND its consumer
          FifoPreviewController in one shot. • SectionGroupService `getAllNestedSectionGroups(): Collection<int,SectionGroup>`
          + `transformGroups(Collection<int,SectionGroup>)`, SectionService `prepareAccessibleSections(Collection<int,Section>)`,
          SectionRepository `getAll(): Collection<int,Section>`.
        LATENT BUG fixed (typing surfaced it): `SectionService::prepareAccessibleSections` read `$group->parent_id`, but
          `section_groups` has NO `parent_id` column (it self-parents via `section_group_id`) → the access was always
          null so the accessible-sections sidebar tree NEVER nested children (the `if ($group['parent_id'] && …)` guard
          was permanently false). Corrected to `$group->section_group_id`; existing SectionServiceTest (single top-level
          group) stays green.
        RUNTIME fallout: PatientServiceTest stubbed `listPatient` with a string sentinel → `TypeError` once the return is
          typed `LengthAwarePaginator` (the documented paginated-mock pattern) → return a real `LengthAwarePaginator`.
        GOTCHAS for the rest of this slice: • the direct lever for `property.notFound` is typing the helper param that does
          `$param->col` and the bare `Collection`/paginator return that feeds the loop — add `@return Collection<int,
          Concrete>` even when the native `: Collection` is already present. • Export classes are NOT clean targets: their
          `$row` accesses are selectRaw/appended aliases (`$row->patient_fullname`, `$row->test_testsname`) — typing `$row`
          to the concrete model swaps base-`Model::$x` errors for `Concrete::$alias` errors (a regression), so audit those
          individually (add `@property` for the alias or leave baselined), don't bulk-type. • measure EVERY cluster:
          empty `phpstan-baseline.neon` → `--generate-baseline` into it (avoids the still-included-old-baseline suppression
          trap) → diff vs `git HEAD:phpstan-baseline.neon` for true regressions/cleared. Did NOT run Pint (consistent with
          prior passes; edits are typed signatures/docblocks + one column-name fix + one test).
      ✅ 2026-06-25 concrete-model repo/service return+param cluster slice (baseline **413 → 372**, −41; `composer analyse`
        green + full suite 578/1380 green). Typed per-cluster, measuring net after each file (rebuilt the measurement loop:
        a baseline-free regen `phpstan.neon` + `--generate-baseline` into the project root for relative paths, diffed vs the
        committed baseline to catch cascades AND cleared entries — count changes on an existing key don't register as
        regressions). Cleared:
        • Reception/AcceptanceItemRepository (−11): list/listAll/getPanelItems returns (LengthAwarePaginator/Collection
          generics), applyAll/limitAccess Builder params+returns. KEY: kept `applyFilters($query)` UNTYPED — typing it
          Builder<AcceptanceItem> makes the `whereHas(..., fn ($q) => $q->search(...))` closures resolve to Builder<Model>
          (patient/test are HasOneThrough, samples BelongsToMany — Larastan can't infer the related model into those
          whereHas closures), on which the Searchable `search()` scope is unseen → 3-count method.notFound false positive.
          Leaving $query untyped gives the SAME net (−11) with zero new baseline entries.
        • Reception/PatientService (−5) + ReportRepository (−6): passthrough/finder returns + applyFilters Builder param.
          Report defines its OWN scopeSearch on the model, so a direct `Builder<Report>::search()` DOES resolve (unlike the
          relation-closure case above) — applyFilters $query safely typed.
        • Model accessors/relations (−12): Section finished/processing/rejected/waitingItems → HasMany<AcceptanceItemState>;
          SectionGroup's three → HasManyThrough<AcceptanceItemState, Section, $this> (they chain `acceptanceItemStates()->where()`,
          so the relation's own type carries through — same hand-typed pattern as activeSamples); AcceptanceItem
          getDeleted(): bool / getStatus(): string; Patient getName/getAge(): string + `$searchable` list<string>.
        • AcceptanceItemStateRepository (−2), AcceptanceItemService/ReportService passthroughs + SignerRepository (−7):
          AcceptanceItemState USES Searchable and applyFilters' $query is the direct Builder<AcceptanceItemState> (not a
          relation closure), so search() resolves → safe to type.
        RUNTIME fallout (documented Mockery pattern): AcceptanceItemServiceTest stubbed listAcceptanceItems/listAllAcceptanceItems
          with string sentinels → TypeError once the repo returns are typed → return a real LengthAwarePaginator/Collection.
        LATENT BUG fixed (typing surfaced it; baseline **372 → 371**, −1 more): `patients` has NO email column, yet
          Consultation/UpdateCustomerToPatientWithConsultationController read `$patient->email` (always null) and passed it
          into updateCustomer — WIPED the customer's email on every customer→patient conversion (note `phone` had a
          `?: $customer->phone` fallback, email did not). A patient's email actually lives on `patientMeta` (HasOne, PatientMeta
          has the `email` column). Fixed by sourcing `$patient->patientMeta?->email ?: $customer->email` (mirrors the phone
          fallback — preserves the customer's email instead of nulling it), which also removed the `Patient::$email` access so
          `PatientService::getPatientById` could be typed `?Patient` (the entry that was deferred). New feature test
          tests/Feature/Consultation/UpdateCustomerToPatientWithConsultationControllerTest.php (2 tests) pins both cases:
          email preserved when no meta email, email taken from meta when present.
      DEFERRED this slice (cascade-prone, per established rules): per-model `scopeSearch` (Report/ReferrerOrder — inner
        whereHas search closures), the staudenmeir deep relations (AcceptanceItem::workflow HasOneDeep, Patient::acceptances
        HasManyDeep), Relative's relationship accessors (explode/implode param typing), and the model-coupled Exports
        (AcceptanceItemsExport/InvoicesExport/TestExport — `$row->alias` selectRaw accesses regress to Concrete::$alias).
      Remaining (baseline **371**): same high-yield slice continues — **missingType.return + missingType.parameter** concrete
        repo/service clusters, then the `property.notFound` tail (audit-individually: Exports' alias `$row->*`, Resources
        needing `@mixin`/ad-hoc shapes, AcceptanceService alias accesses). Also 38 nullsafe.neverNull (kept), argument.templateType.
      ✅ CLOSED via #8 (2026-07-02) — the type tail was driven to **baseline 197 blocks / 193 messages** (target
        <200 MET, from 1,608 = −88%); `composer analyse` green. The residual entries are the intentionally-DEFERRED,
        cascade/ad-hoc tail documented under #8 (User-model type-hints → #11, staudenmeir deep relations,
        Export `$row->alias` selectRaw shapes, whereHas-search cascades, kept `nullsafe.neverNull`).
      ✅ 2026-07-05 User/RBAC typing pass (the foundational slice #8/#11 flagged as the prerequisite; baseline
        **193 → 182 message-blocks**, −11; `composer analyse` green + affected suites 59/59). Cleared all 11
        User/Role/Permission-typed entries: `User::$fillable` `@var array<int,string>`→`list<string>` covariance;
        `ApprovalFlowStep::eligibleUsers(): Collection` given `@return Collection<int,User>` (resolves the
        `ReportApprovalService` `filter(fn(User $user)…)` argument.type); `RoleService::getSectionAndGroupSections`
        param Eloquent→Support `Collection` (matches the Support Collection actually flowing from
        `RoleRepository::getPermissions`; widening, runtime-safe — also cleared a bonus `Model::$name`
        property.notFound); `RoleRepository::{create,getAdminRole}` + `PermissionRepository::{create,
        getPermissionByName}` narrowed spatie `Contracts\{Role,Permission}` → concrete via `/** @var */` on the
        assignment (the concrete model is what the configured spatie resolver returns at runtime); typed the two
        stray `$user` params (`PurchaseRequestService::scopeActiveApproverQuery`, `StoreReferrerOrderAcceptance
        Controller::handlePoolingAcceptance` — the latter param is actually unused, `addAcceptanceItems` re-fetches
        its own `auth()->user()`).
        GOTCHA: `@var` on a `findByName()` result must be the NON-null concrete (`@var Role`, not `Role|null`) —
        spatie's `findByName` returns non-null `Contracts\Role` (throws if missing), so a nullable `@var` trips
        `varTag.nativeType` (not a subtype of the native return). LEFT BASELINED (audited, NOT a typing fix):
        `VerifyEmailController:22` `new Verified($request->user())` wants `MustVerifyEmail` — making `User` implement
        it would activate the live `['auth','verified']` middleware group (routes/web.php:25) and lock out
        unverified users; that's a product decision, the commented-out `MustVerifyEmail` is deliberate.
        REMAINING baseline tail is now purely the non-User deferred clusters (applyFilters/scopeSearch whereHas
        cascades, Export `$row->alias`, ad-hoc Resources, staudenmeir deep relations) — no cheap next lever left.
- [x] 2. Extract raw queries from controllers — ✅ named batch done: Inventory (9) + Referrer (2) + System (2) + Billing (3) + Consultation (2) + Reception (PublishAcceptance eager-load, AcceptanceItemState ::find).
      ✅ 2026-06-22 final sweep — the ~15 flagged leftovers are now all cleared (composer analyse green; full
        suite 577 tests / 1375 assertions green):
        • Inventory/Api lookups → repositories: LookupItemController → ItemRepository::lookupForScan;
          ItemPurchasePriceController → new SupplierItemRepository::purchasePricesForItem; BarcodeScanController →
          new ItemBarcodeRepository::findByBarcodeWithItem + StockLotRepository::{activeLotsByBarcode,activeLotsForItem}
          + StockTransactionRepository::latestLineByBarcode (ItemLotsController was already clean).
        • Inventory writes: ConfirmTransferReceiptController → StockTransactionService::confirmTransferReceipt
          (+ StockLotRepository::activateQuarantinedLots); StockTransactionController/PurchaseRequestController repeat_from
          → {StockTransactionService,PurchaseRequestService}::findForRepeat (+ StockTransactionRepository::findForRepeat);
          PurchaseRequestController bulkApprove/matchTemplate/addComment → PurchaseRequestService::{bulkApproveSteps,
          evaluateTemplates,addComment} (dropped the now-unused WorkflowTemplateMatcher ctor dep);
          WorkflowTemplateController → new WorkflowTemplateService + WorkflowTemplateRepository (list/save/syncSteps/
          deleteIfUnused/formReferenceData).
        • Auth: PasswordController → UserRepository::updatePasswordById; RegisteredUserController → UserRepository::create.
          NOTE: RegisteredUserController referenced a non-existent App\Models\User (latent fatal) — switching to the
          domain User via the repo fixes that bug and removed 2 stale class.notFound baseline entries.
        • QC/QCSamplesController → SampleService::listPendingQcSamples (SampleRepository::listPendingQc).
        • Reception/SampleController → SampleService::{resolveAcceptanceForItem,loadForBarcodeView,updateBarcode}
          (+ AcceptanceItemRepository::findAcceptanceForItem; SampleRepository::{loadForBarcodeView,updateBarcode}).
          SampleService gained an AcceptanceItemRepository ctor dep → SampleServiceTest updated.
        • Monitoring/NodeController → NodeService::{syncFromRemote,getSectionsForSelect} (MonitoringNode upsert +
          the cross-domain Laboratory Section dropdown both moved off the controller).
        • Referrer/CollectRequestController create/edit → CollectRequestService::formReferenceData
          (+ {SampleCollector,Referrer}Repository::all; service gained 2 ctor deps → CollectRequestServiceTest updated).
        • Referrer/StoreReferrerOrderAcceptanceController Acceptance::find → ReceptionAdapter::findAcceptance.
        • ImportController → new Reception PatientImportService (patientFields/mapRows/buildTests/persist via
          Patient+Acceptance repos; AcceptanceItem create+pivot-sync kept verbatim to preserve behavior). Controller
          keeps only validate + Excel read + the two-tier error responses.
        Document/UpdateBatchDocumentsController was already clean (goes through DocumentService).
        Baseline: relocated the larastan false-positives that moved with the code (controllers → their new repo/service
        paths) and removed the ones eliminated outright; net no new entries.
        Remaining (intentionally left, codebase-wide convention): trivial active-reference dropdown lookups
        (`Store::active()->get(['id','name'])`, `Supplier::active()->get(...)`) still inline in a few Inventory
        controllers — a separate, uniform cleanup via {Store,Supplier}Repository::activeForSelect, not raw query *logic*.
      ✅ Reception orchestration extracted: AddPoolingController + GetAcceptancePoolingItemsController →
        AcceptanceItemService::addPoolingItems / buildPoolingItems (+ AcceptanceItemRepository
        getOriginalNonPoolingItems / getPoolingSourceItems). Net baseline −8 entries.
        NOTE: fully typing the AcceptanceItem→MethodTest→Test/Method relation chain cascades widely
        (TestResource appended attrs, ConversionService, PayloadBuilder); left 3 methodTest
        false-positives baselined rather than open that can of worms here. That chain-typing is a
        good dedicated #1 follow-up.
      Remaining controller stragglers are purely cross-domain (Reception RelativeController →
        ReferrerOrder JSON orchestration; Referrer GetPatientAcceptancesController → Reception
        Acceptance; Referrer ExportReferrerTestsController → nested-relation typing). These are
        Adapter problems, not raw-query problems → folded into #3.
      NOTE: full `composer analyse` is the only reliable check for unmatched baseline entries — per-file runs miss them. Some refactors eliminate baselined larastan false-positives, so remove/relocate those entries in the same commit. (2026-06-21: corrected a stale `count: 2`→`1` for BarcodeScanController `Model::$defaultUnit` that was breaking the suite.)
- [x] 3. Introduce Adapters for cross-domain Model coupling — ✅ cleared the three deferred #2 cross-domain controllers:
      • GetPatientAcceptancesController (Referrer→Reception read): query → AcceptanceRepository::getForPatientAndReferrer;
        new Referrer/Adapters/ReceptionAdapter; shape via new Referrer/Resources/PatientAcceptanceResource. Controller now thin.
      • RelativeController (Reception→Referrer write): orderInformation server_id patching + ReferrerOrderPatientCreated
        moved into ReferrerOrderService::attachServerPatientToOrder; new Reception/Adapters/ReferrerAdapter wraps it.
        Controller's 40-line inline block → one adapter call. Covered by 2 new ReferrerOrderServiceTest cases.
      • ExportReferrerTestsController (own-model query w/ Lab relations): query → ReferrerTestRepository::getActiveTestsForReferrer
        + ReferrerTestService passthrough. Was a raw-query-in-controller, not true cross-domain — no adapter needed.
      Baseline: relocated the larastan false-positives that moved with the code (controllers → Resource/Repository),
      net −1 entry (the precise-array return.type one disappeared). `composer analyse` green; relevant tests green.
      ✅ 2026-06-23 service-layer Adapter sweep (`composer analyse` green; full suite 577/1375 green): routed the 7
        services that imported another domain's **Service/Repository** directly (the clearest layering violations) through
        Adapters. New adapters: Billing/Adapters/SettingAdapter (wraps SettingService::getSettingByKey),
        Consultation/Adapters/SettingAdapter (SettingRepository::getSettingsByClass), Reception/Adapters/SettingAdapter
        (SettingRepository::getSettingsByClassAndKey), Referrer/Adapters/LaboratoryAdapter (getSampleTypeName — returns the
        name string, doesn't leak the SampleType model), Inventory/Adapters/DocumentAdapter (storeDocument + findDocument),
        Reception/Adapters/DocumentAdapter (storeDocument/deleteDocument/pathById). Extended Reception/Adapters/ReferrerAdapter
        with syncOrdersForAcceptance + updateOrderStatus. Consumers updated: PaymentService, MaterialService,
        ConsultationService, ReportService, PurchaseRequestService, AcceptanceService, and BuildWordFileService (whose
        Document\Services\DocumentService import was actually dead — removed — and its static Document::find routed via
        app(DocumentAdapter::class)->pathById). PurchaseRequestService fully dropped both Document\Models\Document and
        Document\Services\DocumentService imports. Tests: AcceptanceServiceTest/ConsultationServiceTest mocks repointed to the
        adapters (method renames getSettingsByClassAndKey→getSettingByClassAndKey, syncReferrerOrdersForAcceptance→
        syncOrdersForAcceptance), MaterialServiceTest resolves app(LaboratoryAdapter::class). Baseline: relocated the 2
        moved larastan false-positives (untyped relation → typed adapter param) from the service method to the adapter method
        (ReferrerAdapter::updateOrderStatus ×2, DocumentAdapter::deleteDocument) — net 0, still **962**.
      Remaining cross-domain coupling (still open): (a) services that reference another domain's **Model** for type-hints or
        ad-hoc queries (e.g. ReportService→Laboratory\{Method,Test}, Billing\{DailyCashReportService,InvoiceComposer}→
        Reception\{Acceptance,AcceptanceItem}, Laboratory\*Service→Document\Document, Monitoring/NodeService→Lab\Section);
        (b) the pervasive User\Models\User type-hints (foundational — intentionally left); (c) the ~93 Model→Model Eloquent
        **relation** definitions (belongsTo/hasMany across domains), which inherently need the related class and are not
        practical Adapter targets. (a) is the next meaningful slice and overlaps the deferred #1 model-typing pass.
- [x] 4. Add unit tests for high-risk services — ✅ verified 2026-06-22: all four named services covered; pure unit suite
      (AcceptanceItemConversionServiceTest + ReportServiceDataShapingTest + ReferrerOrderPayloadBuilderTest) green —
      27 passed / 80 assertions. AcceptanceItemConversionService pricing core covered by a new
      pure-logic unit test (tests/Unit/Reception/AcceptanceItemConversionServiceTest.php, 17 tests / 32 assertions):
      the `eval()` safety guards (isSafeExpression/isSafeCondition — injection prevention), substituteParams
      (longest-name-first, missing→0), evalFormula, evalConditional, and resolvePrice dispatch (FIX/FORMULATE/
      CONDITIONAL + string-value + unknown fallback). Private methods exercised via reflection; no DB.
      NOTE: AcceptanceService (18) + ReferrerOrderService (10) already have solid Feature coverage — the real gap
      was the conversion service's formula evaluator, now closed.
      ✅ DB-bound conversion paths covered by a new Feature test (tests/Feature/Reception/AcceptanceItemConversionServiceTest.php,
      7 tests / 24 assertions): ejectPanel (reverts to method default, zeroes discount, recalcs price, logs eject_panel
      conversion, processes every item sharing the panel), promoteToPanel (matches item by method_id, creates items for
      uncovered panel method tests, shares one panel_id, logs promote_to_panel only for promoted items), and the
      calculatePrice cascade (individual test price → method fallthrough when test=0 → test referrer_price when referrer present).
      ✅ ReportService report-data shaping covered by a new pure-transform unit test
      (tests/Unit/Reception/ReportServiceDataShapingTest.php, 8 tests / 38 assertions): prepareReferrer (billingInfo
      vs fallback fields), preparePatientData (placeholder when empty, indexed keys, N/A defaults), prepareSigners
      (empty images, row-keyed name/title + image collection), formatDocumentFiles (frontend shape). The approval/
      publish/reject flow is already covered by ReportApprovalFlowTest. Item #4 effectively closed for the four
      named high-risk services.
- [x] 5. Decompose oversized frontend components — ✅ `Drawing.jsx` (pedigree chart) **2,292 → 883 LOC**,
      split into `resources/js/Components/Pedigree/`: constants.js, nodes.jsx (Male/Female/Unknown),
      ConsanguineousEdge.jsx, LegendItem.jsx, LegendModal.jsx, HelpModal.jsx, EdgeSettingsModal.jsx,
      PedigreeToolbar.jsx, ElementEditor.jsx. Drawing.jsx keeps only the PedigreeChart container
      (state + callbacks) + ReactFlowProvider wrapper; public API (`<Drawing disabled defaultValue />`)
      unchanged. Toolbar/editor/modals were previously inline functions redefined every render
      (remount-on-each-render anti-pattern) → now stable top-level components; label + edge-style
      sync re-keyed on selection id / modal-open instead of relying on remount (behavior preserved).
      Verified: eslint clean, `vite build` green, 35/35 vitest pass. Template proven.
      ✅ Next 5 decomposed (each: container keeps state/handlers, presentational + dialog parts split
      into a sibling folder; public props/exports unchanged; eslint clean, vite build green, 35/35 vitest):
      • Import/Create.jsx **1,689 → 462** → Import/Components/{FileUploadStep, ColumnMappingStep,
        TesmergetSelectionStep, AddTestModal}. 3-step wizard + test-selector dialog.
      • AddTestOrPanel.jsx **1,688 → 348** → Acceptance/Components/AddTestOrPanel/{constants, factories,
        validation, SelectStep, MethodTable, SampleRow, PricingSection, TestConfigStep, PanelConfigStep}.
      • Inventory/PurchaseRequests/Show.jsx **1,572 → 225** → Show/{constants, InfoRow, DiscussionPanel,
        WorkflowProgress, RequestInfoCard, LineItemsCard, ReceivingHistoryCard, TimelineCard,
        HeaderActions, ActionDialogs, TemplateMatchDialog}.
      • ReferrerOrder/Show.jsx **1,356 → 421** → Show/{TabPanel, PatientCard, TestOrderItem,
        StatusTimeline, PatientsTestsTab, OrderFormsTab, ConsentsTab, DocumentsTab, PatientActionDialog}.
      • Patient/Components/PatientForm.jsx **1,131 → 233** → PatientForm/{helpers, CollapsibleSection,
        AvatarSection, PersonalInfoSection, LocationSection, RelationshipSection}. CollapsibleSection
        dedups the repeated Paper+Button+Collapse section header (was inlined 3×).
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, vite build
      green, 35/35 vitest):
      • Consultation/Components/Drawing/PaintApp.jsx **1,076 → 557** → PaintApp/{constants,
        canvasHelpers (pure floodFill/drawShape/drawDiamond/triangle/arrow/number), ColorPicker,
        PaintToolbar, NumberToolbox}. Canvas primitives extracted as stateless functions taking
        ctx+args; the drawing callbacks now call them directly with explicit deps.
      • SectionGroup/Show.jsx **1,042 → 201** → Show/{constants (status/date helpers +
        buildAcceptanceItemColumns + getNestedParents), HeaderCard, SummaryStats, SubGroupCard,
        SectionCard, OverviewTab, ActionsMenu}.
      • Consultation/Components/TimeSlotCard.jsx **1,011 → 315** → TimeSlotCard/{helpers
        (formatTime/getDuration/getStatusConfig), ConsultantInfo, CustomerReservation,
        ConsultationReservation, CardActionsBar}. Theme-color helpers passed down as props.
      • Acceptance/Components/Filter.jsx **963 → 544** → Filter/{constants (options + pure
        rangePreset/reportRangePreset date math), ActiveFilterChips, ClearableDateField (dedups the
        6 near-identical date inputs), PresetChipRow}.
      • Dashboard/Components/Dashboard.jsx **942 → 293** → Dashboard/{styled, metricConfig
        (getMetricConfig + getNumericValue), MetricCard, MetricSkeleton, DashboardHeader,
        DashboardControls, CategorySection}.
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, vite build
      green, 35/35 vitest):
      • AcceptanceItem/Components/SectionsInfo.jsx **922 → 288** → SectionsInfo/{constants (workflowStatus
        + formatDateTime), TabPanel, PatientInfoCard, StatusDot, UserAvatar, SampleTimeline}. Container
        keeps the sample-grouping memo, done/reject form orchestration, header + tabs.
      • Invoice/Components/InvoicePaymentManager.jsx **895 → 129** → InvoicePaymentManager/{constants
        (mock data + sum/format utils + PAYMENT_METHODS/_ICONS), PaymentDialog, PaymentSummary, PaymentsTable}.
      • Section/Show.jsx **884 → 284** → Show/{constants (STATUS_CONFIG + formatDateTime + getNestedParents),
        columns (buildColumns factory), SectionHeader, StatsDashboard (5 stat cards deduped via a StatCard +
        config array), BulkActions}.
      • Components/Upload.jsx **874 → 681** → Upload/{styled (UploadBox/FileTypeInfo), helpers
        (generateTempId/formatFileTypes), TagSelector, FileErrorAlert, FileList, DropZone}. Logic-heavy hook
        body stays in the container; only styled/helpers/presentational parts extracted.
      • Referrer/Components/AddPrice.jsx **866 → 300** → AddPrice/{PriceTypeSelect, FixPriceInput,
        AdvancedPricingFields, MethodPriceSection, TestInfoCard, PanelPricingSection, TestSelection}. The
        price-type select, fix-price input, and advanced (Formulate/Conditional) block were each duplicated
        between the per-method and panel sections — now single shared components.
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, prettier
      clean, vite build green, 35/35 vitest):
      • Test/Components/Form.jsx **849 → 176** → Form/{constants, Sidebar, MobileNav, StepNav,
        StepHeader, BasicStep, SamplesStep, PricingStep, MethodsStep, DescriptionStep}. Wizard
        container keeps step/pricingTab state + validate/submit; each step takes the rendered
        `nav` node so the inline bottom-nav placement is preserved.
      • Acceptance/Components/AddPayment.jsx **849 → 387** → AddPayment/{constants (buildPaymentMethods
        + PAYMENT_METHOD_VALUES), validation (pure validatePaymentForm), PayerAmountSection,
        PaymentMethodSelector, MethodDetailsFields}.
      • Statement/Components/AddForm.jsx **841 → 396** → AddForm/{helpers (buildInitialDetails),
        StatementDetailsPanel (referrer/month + selected chips), InvoiceSelectionPanel (search +
        table + loading/empty states)}.
      • Role/Components/Form.jsx **835 → 385** → Form/{Permission (memo card), PermissionTree
        (mutually-recursive PermissionGroup + PermissionChildren kept in one module), PermissionActions}.
      • Sample/Components/AddForm.jsx **825 → 315** → AddForm/{helpers (pure computeValidation +
        getStatusColor), DialogHeader, ProgressBanner, MaterialField, BarcodeCard (the repeated
        per-barcode card, ~283 LOC)}.
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, prettier
      clean, vite build green, 35/35 vitest):
      • Acceptance/Show.jsx **825 → 305** → Show/{constants, StatusChip, SectionTitle, InfoItem,
        SummaryCard, PriorityChanger, SummaryCards, QuickActions, ReportSamplingSection,
        DoctorInfoSection, TestItemsSection}. Container keeps totals memo + item edit/promote/eject
        handlers; the three info accordions and the test-items table+dialogs+totals are presentational.
      • Patient/Show.jsx **823 → 379** → Show/{helpers (formatCurrency/formatDate/renderStatusChip/
        renderViewButton), TabPanel, columns (4 buildXColumns factories), PatientSummaryCard,
        PatientTabsNav}. Container keeps tab lazy-load orchestration + flash-message effect.
      • Acceptance/Index.jsx **822 → 239** → Index/{helpers (formatCurrency/getStatusInfo/
        getBarcodeChipColor/getRowClassName), columns (buildColumns factory), CancelDialog}.
        Container keeps useForm + delete/cancel/pooling dialog state.
      • TAT/Dashboard.jsx **814 → 203** → Dashboard/{constants (PRESETS), widgets (SummaryCard/
        PriorityChip/TATBar/SkeletonRows), SummaryCards, SectionBreakdown, ActiveItemsFilters,
        ActiveItemsTable, AnalyticsControls}. Container keeps axios fetch + abort-controller logic.
      • Report/Show.jsx **774 → 317** → Show/{helpers (formatDate/getStatusChip), ReportHeader,
        PatientSection, ReportContent, ClinicalReport, StepApproveDialog, UnpublishDialog}. Container
        keeps useForm + approval-flow step context + dialog orchestration.
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, prettier
      clean, vite build green, 35/35 vitest):
      • Patient/Merge.jsx **754 → 391** → Merge/{constants (FIELD/META/RELATION labels), helpers
        (isEmpty/avatarUrl/displayValue/displayMetaValue/smartDefaults), ChoiceCell, PatientSummaryCard,
        ComparisonTable, AvatarPicker, ConfirmMergeDialog}.
      • Inventory/Transactions/Add.jsx **740 → 356** → Add/{helpers (USES_EXISTING_LOTS + emptyLine/
        toPayloadLine/linesFromSource/payloadFromSource line-state shapers), TransactionDetailsCard,
        LineItemCard (the per-line barcode/item/unit/lot/location card)}.
      • Layouts/AuthenticatedLayout.jsx **728 → 311** → Components/{createAppTheme (~180-LOC MUI theme
        factory, pure), DrawerContent (nav drawer body + dark-mode toggle), TopAppBar (app bar toolbar
        + account Menu, previously inline)}.
      • Acceptance/Components/Payment.jsx **717 → 309** → Payment/{constants (formatCurrency +
        PAYMENT_METHOD_ICONS/_LABELS), PaymentSummary, PaymentsTable (header/body/footer + row icons),
        NoInvoiceView, ActionButtons}. These were inner fns redefined every render → now stable.
      • Invoice/Components/InvoiceEditForm.jsx **711 → 328** → InvoiceEditForm/{constants (STATUS_OPTIONS
        + statusMeta/num/formatMoney), SubjectEditor, SummaryRow, PartyCard, QuickControls (owner toggle
        + status select), TotalsSummary}.
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, prettier
      clean, vite build green, 35/35 vitest):
      • Acceptance/Components/AcceptanceForm.jsx **709 → 320** → AcceptanceForm/{ConsultationCard
        (memo; was a top-level fn in the file), AcceptanceSummary (the ~260-LOC step-5 review Paper +
        prescription accordion, lazy)}. Container keeps stepper state + renderStepContent for steps 0–4.
      • Inventory/Transactions/Edit.jsx **705 → 348** → Edit/{TransactionDetailsCard, LineItemsTable
        (head + per-line table rows)}; reuses the shared ./Add/helpers (added lineFromExisting there
        alongside USES_EXISTING_LOTS/emptyLine/toPayloadLine instead of duplicating). Barcode/sync
        handlers stay in the container (mirror Add.jsx).
      • Components/SingleDocumentViewer.jsx **702 → 310** → SingleDocumentViewer/{LoadingComponent,
        FileTypeIcon, ErrorBoundary, ViewerContent (the ext→viewer switch + lazy viewers, LazyViewer
        wrapper dedups the per-type ErrorBoundary+Suspense), ViewerToolbar, FileInfoDialog (InfoRow
        dedups the 5 repeated label/value rows)}. Preserved the info dialog's two distinct close paths
        (backdrop→handleClose+parent onClose vs button→close-only).
      • ReferrerOrder/Components/AddSampleForm.jsx **694 → 256** → AddSampleForm/{helpers
        (getAvailableSampleTypes/getFilteredSamples/buildCleanedBarcodes), SampleTableHead,
        PoolingItemSelector, BarcodeSampleRow (the ~340-LOC per-barcode table row)}.
      • Report/Components/ApproveForm.jsx **690 → 267** → ApproveForm/{helpers (formatDocumentName/
        getDocumentViewUrl), DocumentSelectItem + SelectedDocumentValue (the document menu-item layout +
        select renderValue were each duplicated between the published-report and clinical-document
        selects → now shared, chipColor-parameterised), ApproveDialogHeader, PublishedReportSelect,
        ClinicalDocumentTab, EditorTab}.
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, prettier
      clean, vite build green, 35/35 vitest):
      • Workflow/Components/Form.jsx **686 → 190** → Form/{constants (TYPE_COLOR), SortableSection
        (the ~176-LOC dnd-kit pipeline node), WorkflowIdentityCard (left name/status/summary card),
        PipelineHeader, EmptyPipeline}.
      • Consultation/Components/EditForm.jsx **686 → 430** → EditForm/{helpers (formatDate),
        CustomerInfoSection (phone Autocomplete + name + email), TimeSlotPicker (radio time-slot
        grid + loading/empty states)}.
      • Invoice/Print.jsx **663 → 74** → Print/{CompanyHeader (bilingual letterhead + invoice meta),
        ClientInfo (billing block + custom-subject/patient switch), ItemsTable (line items + totals
        + VAT footer), PaymentSummary (patient payment + company credit blocks)}. Container keeps the
        computed address/advPayment + cancel overlay.
      • Billing/BillingCharts.jsx **655 → 43** → BillingCharts/{constants (fmt + METHOD_COLORS/
        _LABELS), BarTooltip, PieLabel, ChartSection, IncomeByTestSection, IncomeByReferrerSection,
        PaymentMethodSection, IncomeTrendSection}. Each recharts section now self-contained; container
        is pure composition.
      • Notification/Index.jsx **613 → 329** → Index/{helpers (fetcher + formatRelativeTime),
        NotificationCard (was an inline render fn), NotificationToolbar (search + select/filter menu),
        BulkActionBar (multi-select actions), ActionMenu (per-item menu)}. Container keeps SWR + the
        markAsRead/Unread/delete API methods + selection state.
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, prettier
      clean, vite build green, 35/35 vitest):
      • Consultation/Components/AddForm.jsx **594 → 344** → AddForm/CustomerInfoSection; REUSES the
        already-extracted EditForm/{TimeSlotPicker, helpers.formatDate} (byte-identical time-slot Paper +
        date formatter). AddForm's customer section kept its own (no phone/name error display, distinct
        title/autocomplete id) to preserve exact behavior.
      • Acceptance/Components/CreateInvoiceForm.jsx **594 → 327** → CreateInvoiceForm/{helpers
        (getOwnerAvatar), OwnerCard, InvoiceSummary}. The patient + referrer selectable cards were
        near-identical (color/label/icon/value/extra differences only) → one shared OwnerCard.
      • Inventory/Transactions/Show.jsx **589 → 119** → Show/{constants (STATUS/TYPE colors + EVENT_META +
        InfoRow), HeaderActions, TransactionDetailsCard, LineItemsCard, AuditTrail, ReturnDialog}.
      • Components/DocumentsInfo.jsx **585 → 251** → DocumentsInfo/{constants (allTags), getFileIcon,
        DocumentCard, DocumentsView, UploadPanel}. The inner `DocumentsManager` was redefined every
        render (remount anti-pattern) → now stable top-level DocumentsView/UploadPanel chosen by `edit`.
      • Monitoring/Nodes/Show.jsx **584 → 115** → Show/{constants (PERIODS + Field + formatTime/
        tickFormatter), SensorChart, PeriodBar, FetchButton, SectionForm, NodeInfoCard, ReadingsCard}.
        The inline top-level components were already well-factored — lifted out + extracted the two cards.
      ✅ Next 5 decomposed (same template: container keeps state/handlers, presentational + helper
      parts split into a sibling folder; public props/exports unchanged; eslint clean, prettier
      clean, vite build green, 35/35 vitest):
      • Inventory/WorkflowTemplates/Form.jsx **578 → 184** → Form/{constants (emptyStep), SortableStep
        (the ~190-LOC dnd-kit step node), TemplateInfoCard, MatchingConditionsCard, ApprovalStepsCard
        (owns the DndContext/SortableContext)}.
      • CollectRequest/Show.jsx **567 → 149** → Show/{constants (referrerOrdersColumns + getGoogleMapsLink),
        helpers (buildTemperatureData/buildTemperatureStats), LocationCard (dedups start/end), TemperatureCard
        (stats + lazy chart), LogisticsSection}.
      • Acceptance/Components/InvoiceReceipt.jsx **566 → 74** → InvoiceReceipt/{styled (all ~18 styled
        primitives + InfoItem + A5 consts), helpers (formatDate + computeTotals + computeReportDays),
        ReceiptHeader, PatientInfo, TestDetailsTable, PaymentDetailsTable, TotalsTable}.
      • Materials/Components/AddForm.jsx **551 → 124** → AddForm/{constants (emptyTube), SampleTypeSection,
        TubesTableView (>5 tubes), TubeCard, TubeDetailsSection (picks table vs cards)}.
      • RequestForm/Components/AddRequirementForm.jsx **549 → 239** → AddRequirementForm/{constants
        (SlideTransition + getFieldTypeIcon/getTypeDescription), FieldPreview (live preview), FieldConfigInputs
        (the form grid)}. Container keeps validation + change handlers + the dialog shell.
      Remaining offenders still open (next sweep, largest first): the tree now tops out ~549
        (Layouts/TableLayout, Acceptance/Components/TestsSection/PanelRow ~545, Acceptance/Components/Filter
        ~544, CollectRequest/Index ~530, Patient/Index ~526). (Drawing.jsx 883 + Upload.jsx 681 are
        already-decomposed orchestrators.)
      ✅ CLOSED via #10 (2026-07-04) — the entire 500+ LOC non-orchestrator band was cleared across three
        decomposition batches; the tree now tops out at 495 (Section/DoneForm, AddTestOrPanel/PanelConfigStep),
        with the only remaining 500+ files being the already-decomposed orchestrators (Drawing 883 / Upload 681 /
        PaintApp 557 / Acceptance-Filter 544) + generated `routes.jsx`. eslint + prettier clean, vite build green,
        vitest 53/53. Any 400–495 LOC tidy-up is optional polish, not a tracked gap.
- [x] 6. Remove console.log + add no-console lint rule ✅

---

## Refreshed plan — 2026-06-30 (re-review)

Status snapshot: #2/#3/#4/#6 landed; #1 baseline **1,608 → 371** (−77%); #5 oversized
frontend **2,292 → 556** top LOC. Remaining work below, highest value first.

**Status snapshot — 2026-07-05 (all items complete):** #1–#13 all landed. PHPStan baseline
**1,608 → 182 blocks** (−89%; `composer analyse` green); #5/#10 frontend 500+ non-orchestrator
band fully cleared (tops out at 495); test suites green (PHPUnit 620/1474 + Vitest 53). Latest:
the foundational **User/RBAC typing pass** (#1 follow-up, PR #75, merged) cleared the last 11
User/Role/Permission-typed entries (193 → 182). No cheap baseline lever remains — the residual
entries are the deferred-by-design clusters (whereHas-search cascades, Export `$row->alias`
selectRaw shapes, ad-hoc Resources, staudenmeir deep relations, and the intentional
`VerifyEmailController`/`MustVerifyEmail` case). Any deeper shrink is a new, scoped task, not
baseline churn.

**Verification — 2026-07-05:** re-ran all CI gates on `main` to confirm the completion claims.
`composer analyse` green (0 errors, baseline exactly **182 blocks**); PHPUnit **625/1483** green
against `lis_test` (grew past the 620/1474 snapshot, still 0 failures); Vitest **53/53**; ESLint
(`eslint resources/js`) exit 0. All #1–#13 claims reproduce.

**#14 landed — 2026-07-05:** the Exports typing cluster was executed (see below). PHPStan baseline
**182 → 147 blocks** (−35; `composer analyse` green); PHPUnit **627/1504** green (+ a new export test).
`AcceptanceItemsExport` fully cleared via a typed row DTO; `TestExport`/`ReportTemplateParameterExport`/
`AcceptancesExport` typeable entries cleared; the `collect($mixed)`/staudenmeir tail left deferred by design.

### 7. Audit the NON-type baseline entries — real bugs hiding in the baseline (High / Low)
Distinct from the mechanical type slices in #1: ~15 baselined entries are genuine logic
smells, not "missing type" noise. Audit each, fix at source, drop the entry.
- ✅ 2026-06-30 done (baseline **371 → 360**, −11; `composer analyse` green + full suite
  **580/1384** green). Fixed 9 real latent bugs, removed the matching baseline blocks:
  • **ConsultantRepository / UserRepository `all()`** — `orderBy`/`paginate` read an undefined
    `$filters` instead of `$queryData`, so client **sort and pageSize were silently ignored**
    (always `id asc`, always 10 rows). Sourced from `$queryData` (mirrors SampleTypeRepository).
  • **OfferDTO::toArray()** — `tests`/`referrers` used `|| []` (logical-OR → **returned booleans**
    instead of the arrays). → `?? []`.
  • **AcceptanceItemStateDTO::fromAcceptanceItemState()** — `details || ""` passed a **bool into
    `?string`** (coerced to "1"/""), clobbering the saved details text. → `?? ""`. (Also cleared a
    real `argument.type` baseline entry.)
  • **TestDTO::fromArray()** — `$existingType ?? TestType::from(...)` referenced an undefined var
    (dead coalesce). → `TestType::from(...)`.
  • **InvoicesExport** — `(object)$item["patient"] ?? []` had a **precedence bug** (cast binds
    before `??`, so the fallback was dead and a missing key warned). → `(object)($item["patient"] ?? [])`.
  • **ConsultationRepository** — `match(env('DB_CONNECTION'))` → `config('database.default')`
    (config-cache hazard: `env()` returns null when config is cached).
  • **ReportService::preparePatientData()** — `Carbon::parse($dob)->format(...) ?? 'N/A'`; a **null
    DOB rendered today's date** (`Carbon::parse(null)` = now), `?? 'N/A'` never fired. Guarded with `filled()`.
  • **PatientService::updatePatient()** — removed a dead `if (isset($data['documents']))` block
    (`$data` never existed; no `documents` input in request/DTO/frontend → never ran).
- DEFERRED as audited-benign (not bugs, left baselined): `match.alwaysTrue` on DocumentTag /
  TestExport (redundant but defensive `default` arm on a fully-covered enum), ReportRepository
  `assert()` ×2 (intentional persisted-model guards), ValidateEnvCommand `env()` (it IS the env
  validator). One borderline robustness follow-up: EscalateOverduePurchaseRequestSteps `if ($role)`
  is always-true because `Role::findByName` throws instead of returning null — a bad role name
  aborts the whole escalation batch; switch to `->first()` if graceful-skip is wanted.

### 8. Finish #1's type tail — target baseline < 200 (High / Medium)
Continue the proven measured-cluster method (regen-into-root baseline + diff). Remaining
identifiers: `missingType.return` (74) + `missingType.parameter` (49) concrete repo/service
clusters; then the audit-individually `property.notFound` (64) tail (Exports `$row->alias`
selectRaw accesses, Resources needing `@mixin`/ad-hoc shapes), `property.nonObject` (26),
`missingType.property` (19). Keep/review `nullsafe.neverNull` (38). Overlaps #11.
- ✅ 2026-07-02 **TARGET MET — baseline 360 → 197 blocks** (−163, −45%; `composer analyse` green +
  full suite **584/1407** green). Measured-cluster method throughout (baseline-free `phpstan-measure.neon`
  → `--error-format=json`, path-keyed diff to catch cascades & line-shift false positives, regen into root
  baseline per checkpoint). Cleared, in order:
  • **Controller return types (22, cascade-free):** all Excel `__invoke` → `BinaryFileResponse`; empty
    resource-stub actions → `void`; `show`/`index` → `JsonResource`/`LengthAwarePaginator`; two fall-through
    methods got explicit `return null` (else `return.missing`); `ReportController::convertParameters`
    docblocked to the real `ReportParameter` element type.
  • **Model relation/accessor returns:** Invoice patient/sponsorPayments → `HasMany`, Sample
    active/deactivateAcceptanceItems → `BelongsToMany`, Document/Referrer/ReportTemplateParameter/Relative
    accessors → scalar/`array`/`void`.
  • **Repo/service concrete-model passthroughs** (findById/store*/getDocument/getByBarcode/loadForShow/
    getTestById/listBarcodes/convert*/etc.) mirrored to their already-typed repo returns; `AcceptanceService`
    export/reported helpers → `Support\Collection`.
  • **Parameters:** WhatsappMessageRepository `array`, CollectRequestEvent `int|string`, ReportService
    prepare* → `?Support\Collection`, InvoiceComposer `Test`; **all 12 `applyFilters`/`applyFilter` → `: void`**
    (params left deferred where inner `whereHas(...->search())` cascades).
  • **`property.nonObject` FormRequest cluster (24):** the `$this->route()->parameter("x")->id` pattern in 20
    `Update*Request`s → a typed private `route<Model>Model()` helper (works across authorize/rules/closures,
    no scope traps).
  • **`missingType.property` (18):** every model `$searchable` → `@var list<string>` (script-injected).
  • **`property.notFound`:** `AcceptanceItemStateResource` `@mixin` (the plan's earlier revert now works —
    relations typed since) −12; `convertAcceptanceItems` param typed `Collection<AcceptanceItem>` + 1 dynamic
    `@property _sampleTypeId` + 3 `$newModel->patient = …` → `setRelation('patient', …)` (relation write) −27;
    ShowStatement/StatementService `prepareInvoicesData` params typed `Collection<Invoice>` + query-alias
    `@property-read`s on Invoice (`invoice_items_sum_*`, `payments_sum_price`, `invoice_no`) / Acceptance /
    AcceptanceItem (`report_date`) / OrderMaterial (`sample_type_name`, `referrer_fullname`) / Section
    (`section_workflows_*`); Document `@property int $id`; Report runtime `@property $files`;
    `InvoicesExport::patientFor/methodFor` → `?Patient`/`?Method`; `findAcceptanceItemStateByBarcode` return
    generic (repo+service).
  **Latent bugs fixed (typing surfaced them):** (a) `Material::sample()` had NO `return` → the hasOne relation
    was always null; (b) `RoleDTO::toArray()` used `$this->prmissions` (typo) → roles were persisted with
    **null permissions**; (c) `UpdateAcceptanceRequest::authorize()` had a misplaced paren
    (`Gate::allows("create", $model && $status==PENDING)`) → the create gate received a **bool instead of the
    model**; (d) `DailyReceptionReportExport` used object access (`$this->report->report_date`) on an
    `array`-typed property → summary cells silently broke (dead code, still fixed); (e)
    `WorkflowProgressionService::determineNextSection()` was called with a vestigial 3rd arg; (f)
    `OrderMaterialRepository::applyFilters` had a dead `return $query` (callers ignore it).
  DEFERRED (unchanged, cascade/ad-hoc tail): `nullsafe.neverNull` (kept, intentional), `argument.templateType`
    (`collect($mixed)` — needs upstream typing), remaining Export `$row->alias` selectRaw accesses,
    `ListResource`/`SectionOptionResource` (generic/ad-hoc shapes), staudenmeir deep relations
    (`AcceptanceItem::workflow`, `Patient::acceptances`), `scopeSearch`/`InvoiceRepository::applyQuery`
    (whereHas-search cascade), polymorphic `MorphTo->prop` (TimeController/UpdateCustomerToPatient), User
    model type-hints (#11). FINDING (not fixed, no test + wrong columns too): `Offer`/`ReportTemplateParameter`
    repos call `$query->search(["name"], …)` but the models don't `use Searchable` **and** search a
    non-existent `name` column → a search filter throws `BadMethodCallException`; left baselined via `void`
    return only.

### 9. Test-suite stabilization + unit density (High / Medium) — extends #4
Two tracks: (a) clear the known suite rot so `php artisan test` is fully green and CI-
trustworthy (see memory for the lis_test setup); (b) raise unit coverage past the original
four — only **5 unit files for 80 services**. Next risk tier: DailyCashReportService,
InvoiceComposer, StockMutationService, WorkflowService, and the billing/pricing math.
- ✅ 2026-07-04 (a) suite is already fully green — full run **584/1407 → 620/1474** after this
  slice; the historical rot stays resolved (DB in docker `lis_mysql` / `lis_test`, DB-only CLI
  override per memory). `composer analyse` green, Pint clean on the new files.
  ✅ (b) unit density raised for the named next-risk tier — **+36 pure unit tests, 3 new files**,
  all DB-free (private helpers exercised via reflection / in-memory models with `setRelation`,
  ~0.2s each). The DB-bound orchestration each already had Feature coverage; these pin the leaf
  decision/pricing functions the Feature tests only reach transitively:
  • **tests/Unit/Billing/InvoiceComposerTest.php** (20): `isLocked` (statement/settled-status),
    `kindFor` (panel_id+PANEL type), `keyForAcceptanceItem`/`keyFor` bucket keys (panel/mergeable/
    singleton + `item:` fallback), `payloadFor` (panel qty=1 priced at child-sum vs test unit-price×count),
    `descriptionFor` (camelCase price params → "Label=value"), `normalizeCustomParameters` (double-encoded
    JSON defense).
  • **tests/Unit/Billing/DailyCashReportServiceTest.php** (8): `buildRow` remaining/prepayment math,
    credit-payment exclusion, unique payment-method join, `receipt_no` extraction (CARD/TRANSFER only,
    transferReference-preferred, dedup/blank-drop), referrer fullName; `extractTestNames`/`extractPatientNames`
    (unique-by-id merge of item patients + acceptance patient).
  • **tests/Unit/Inventory/StockMutationServiceTest.php** (8): `generateBarcode` (item_code + brand-slug
    uppercase/whitespace-collapse, txId fallback without brand, ITEM{id} fallback without item_code);
    `validateStock` (outbound-only, shortage strings, Item#{id} label without a name — lot lookups stubbed).
  WorkflowService intentionally NOT given a unit test: it's thin repository passthrough (its one
  `deleteWorkflow` guard is already in tests/Feature/Laboratory/WorkflowServiceTest.php) — a unit test
  there would only re-assert delegation with no DB-free pure logic to pin.
  Unit files now **8** (was 5: Example + the four originals) + these three. No bugs surfaced —
  all three services were already well-covered at the Feature level; this closes the fast-unit gap.

### 10. Frontend tail + component tests (Medium / Medium) — extends #5
~10 files left in the 500–556 LOC band: TableLayout (556), TestsSection/PanelRow (545),
Acceptance/Filter (544), CollectRequest/Index (530), Patient/Index (526). The three
`*/Components/Filter.jsx` (Invoice 521, Payment 519, Acceptance 544) are near-identical →
dedup into a shared filter rather than three separate decompositions. Separately: vitest is
only 35 tests — add interaction tests for the critical flows (acceptance create, invoice,
report approval) so the decomposition work is regression-guarded.
- ✅ 2026-07-04 decomposition batch (5, same proven template: container keeps state/handlers,
  presentational + helper parts split into a sibling folder; public props/exports unchanged;
  eslint clean, prettier clean, vite build green, 35/35 vitest):
  • Layouts/TableLayout.jsx **556 → 284** → TableLayout/{Overlays (No-rows/Loading),
    dataGridStyles (buildDataGridSx theme factory, ~75-line sx object), FilterPanel, TableHeader}.
    Shared app-wide layout — pure extraction, behavior preserved (raw onExport/onClickAddNew
    threaded through so the header guards are byte-identical).
  • Acceptance/Components/TestsSection/PanelRow.jsx **545 → 303** → PanelRow/{PatientChips,
    DetailsCell, ConfirmDialogs (Delete+Eject), ActionButtons, PriceDisplay}. These were already
    stable top-level subcomponents in the file → lifted into the sibling folder.
  • CollectRequest/Index.jsx **530 → 170** → Index/{constants (STATUS_COLORS + fmtDateTime +
    buildCalendarDays + DAY/MONTH names), CalendarView (~215-LOC month grid + event tooltips),
    columns (buildColumns factory)}.
  • Patient/Index.jsx **526 → 144** → Index/{columns (buildColumns + renderDebt), StatsDashboard
    (StatsCard + NationalityList + GenderStats + getGenderInfo, the whole stats Accordion)}.
  • Materials/Barcodes.jsx **525 → 174** → Barcodes/{constants (FIELDS/DEFAULT_FIELDS/FONT_SCALES
    + loadPrefs/savePrefs localStorage + formatDate), styled (6 print-label styled primitives),
    GlobalStyles (print @page injector), PrintControls (field checkboxes + font-size toggle),
    BarcodeLabel (per-material label render)}.
  NOTE on the Filter dedup: audited Invoice/Payment/Acceptance `Filter.jsx` — they are NOT
  near-identical (divergent field sets: invoice_no/owner vs paymentMethod/amount-range with its own
  date parsing vs Acceptance's status/priority/how-found set), so a forced shared abstraction would
  risk behavior drift across three flows. Decompose each individually per the standard template
  instead (Acceptance/Filter already done in an earlier pass, 963 → 544 orchestrator).
  Remaining 500+ band (next sweep): Invoice/Components/Filter (521), Payment/Components/Filter (519),
  Workflow/Components/SectionForm (515), Consultants/Show (515), Invoice/Components/InvoiceItemsField
  (514). Then the vitest interaction-test track (critical flows) is still open.
- ✅ 2026-07-04 decomposition batch 2 (5, same proven template: container keeps state/handlers,
  presentational + helper parts split into a sibling folder; public props/exports unchanged;
  eslint clean, prettier clean, vite build green, 35/35 vitest):
  • Invoice/Components/Filter.jsx **521 → 242** → Filter/{constants (DATE_PRESETS + pure
    getPresetRange date math + formatDateForBackend), SearchFields (patient + invoice_no, shared
    search-adornment helper), OwnerFilter (owner-type select + SelectSearch), DateRangeSection
    (preset chips + date pickers, chips now mapped from DATE_PRESETS)}.
  • Payment/Components/Filter.jsx **519 → 316** → Filter/{constants (parseDateFromServer/
    formatDateForServer + getPresetRange + DATE_PRESETS), AmountRange (min/max + decimal guard),
    DateRangeSection}. Search + payment-method select kept inline (small, one-off).
  • Workflow/Components/SectionForm.jsx **515 → 266** → SectionForm/{constants (PARAM_TYPES/
    TYPE_COLOR/EMPTY_PARAM), StepLabel, ParameterRow, ParameterEditor (the ~135-LOC name/options
    + type-chip + required/actions box)}. Container keeps section-select + param CRUD handlers.
  • Consultants/Show.jsx **515 → 109** → Show/{helpers (formatDate + getStatusChip), ProfileCard
    (banner/avatar/contact; ContactRow dedups the two icon rows), StatsCard (owns its stats array),
    RecentConsultationsCard (the recent-consultations Paper + table)}. Calendar Paper kept inline
    (wraps the shared TimeCalendar).
  • Invoice/Components/InvoiceItemsField.jsx **514 → 243** → InvoiceItemsField/{constants
    (KIND_LABEL/KIND_COLOR/num/blankItem), EmptyState, InvoiceItemRow (the ~230-LOC editable row +
    delete-staged variant; KindChip/LockBadge lifted in as local subcomponents)}. Container keeps
    the field/delete/rebuild/reset handlers + table shell.
  Remaining 500+ band (next sweep, excluding already-decomposed orchestrators Drawing 883/Upload 681/
  PaintApp 557/Acceptance-Filter 544 and generated routes.jsx): Consultation/TimeCalendar (513),
  Import/Components/AddTestModal (511), Report/Components/ReportForm (505), FailedJob/Index (504),
  Consultation/Show (502). Then the vitest interaction-test track (critical flows) is still open.
- ✅ 2026-07-04 decomposition batch 3 (5, same proven template: container keeps state/handlers,
  presentational + helper parts split into a sibling folder; public props/exports unchanged;
  eslint clean, prettier clean, vite build green, 35/35 vitest). **This clears the entire 500+ band
  of non-orchestrator components** — the tree now tops out at 495 (Section/DoneForm,
  AddTestOrPanel/PanelConfigStep), with the only remaining 500+ files being the already-decomposed
  orchestrators (Drawing 883/Upload 681/PaintApp 557/Acceptance-Filter 544) + generated routes.jsx (523):
  • Consultation/Components/TimeCalendar.jsx **513 → 215** → TimeCalendar/{constants (DAYS_OF_WEEK/
    MONTH_NAMES + pure formatDateISO/isSameDay/isToday/formatDate/buildCalendarDays), CalendarHeader
    (month label + nav buttons), CalendarGrid (weekday header + day cells + slot indicators),
    SelectedDaySlots (per-day TimeSlotCard grid + empty state)}. Container keeps currentDate/selectedDate
    state + the by-date grouping memos + navigation/month-change callbacks.
  • Import/Components/AddTestModal.jsx **511 → 107** → AddTestModal/{SelectTestStep (type select +
    SelectSearch + test-details card), ConfigureStep (method table + sample-type select + price input),
    PanelConfig (panel alert/details + per-test sample-type table), ModalFooter (back/cancel + continue/
    add-test with the disabled-guard logic)}. Pure presentational — container is just the Dialog + Stepper shell.
  • Report/Components/ReportForm.jsx **505 → 273** → Form/{helpers (getActiveStep + pure
    computeParameterErrors), ReportFormHeader (status chip), TemplateSelector (template/parameter download
    buttons + template Select), ReportFormTabs (Documents/Parameters TabContext, TabLabel dedups the
    badge/plain label)} — reuses the existing Form/{ParameterSection,DocumentUploadSection}. Container keeps
    expanded/tab/parameterErrors/isSubmitting state + validate/submit orchestration.
  • FailedJob/Index.jsx **504 → 223** → Index/{ExceptionDialog, TypeSummaryBar, BulkConfirmDialog,
    FailedJobFilter, columns (buildColumns factory)} — these were already stable top-level components in the
    file; lifted into the sibling folder. The named `FailedJobFilter` export is re-exported from the
    container to keep the public API. Container keeps the retry/delete/bulk router calls + selection state.
  • Consultation/Show.jsx **502 → 154** → Show/{helpers (formatDate), StatusBadge, ConsultationReport (the
    'done'-status report Card w/ image-or-Drawing + edit), ActionContent (status→start/complete/report/
    fallback switch), PatientInfoCard, ConsultationDetailsCard (consultant/date/duration grid + ActionContent)}.
    Container keeps useForm + start/update/done-form handlers.
- ✅ 2026-07-04 **vitest interaction-test track — critical flows (the last open item under #10)**:
  added **+18 interaction tests, 3 new files** (vitest **35 → 53**; eslint clean, prettier clean).
  These guard the decomposition work above by pinning each flow's decision/mutation logic (not just
  rendering); heavy child composites are stubbed so each container's own handlers are exercised in
  isolation, mirroring the existing Edit.test.jsx / EditSampleModal.test.jsx style.
  • **resources/js/Pages/Acceptance/Add.test.jsx** (7 — acceptance create): captures the `onSubmit`
    handed to the stubbed `AcceptanceForm` and drives the step-based validation gate — step 3 requires a
    test/panel (else `setError('acceptanceItems')`, no post); step 2 requires a referrer when `referred`;
    step 4 rejects unknown reporting method + invalid email; valid steps post to `acceptances.store`
    (scoped to the patient); step 0 never submits. Add.jsx validates against useForm's `data` (not the
    save arg), so each test seeds the mocked `data`.
  • **resources/js/Pages/Report/Components/ApproveForm.test.jsx** (6 — report approval): real dialog
    buttons + stubbed field children (PublishedReportSelect/ClinicalDocumentTab/EditorTab). Approve →
    `onSubmit`; Cancel → `onCancel`; update-mode (data.approver) flips labels to "Update"; processing
    disables actions + shows the busy label. Captures the field `onChange`s and asserts the `setData`
    updaters: selecting a published report that equals the current clinical doc clears it (no double
    publish); selecting an existing clinical document drops editor content.
  • **resources/js/Pages/Invoice/Components/InvoiceEditForm.test.jsx** (5 — invoice edit/create): stubs
    InvoiceItemsField + InvoicePaymentManager. Save → `onSubmit` with the form data when status+owner set;
    blocked when owner_type missing; brand-new invoice shows the "Create Invoice" label; and the payment
    manager callback appends a new payment and removes one on `{_method:'delete'}` (asserted via the
    manager's re-passed `invoice.payments`).
  Remaining under #10: the frontend-tail decomposition is done (500+ band cleared); this closes the
  named interaction-test track. Further flows (e.g. AddTestOrPanel wizard, statement builder) are
  optional follow-ups, not tracked gaps.

### 11. Cross-domain Model type-hints (Medium / Medium) — closes #3 remainder (a)
Services type-hinting another domain's **Model** directly: ReportService→Laboratory\{Method,
Test}, Billing\{DailyCashReportService,InvoiceComposer}→Reception\{Acceptance,AcceptanceItem},
Laboratory\*Service→Document\Document, Monitoring\NodeService→Lab\Section. Route through
Adapters / typed DTOs. Do alongside #8 (these are the same model-typing cascade).
- ✅ 2026-07-04 (`composer analyse` green — no new/unmatched baseline entries; affected suites
  80/80 green: Monitoring/Node, Billing DailyCash+InvoiceComposer Unit+Feature, Reception
  ReportApprovalFlow + ReportServiceDataShaping, Laboratory Section/SectionGroup; Pint clean on
  the 2 new adapters). Two **full closures** (foreign-domain Model import removed outright) + two
  **query/write extractions** through a new adapter (the deeply-woven private-helper type-hints
  left, same acknowledged impractical category as the ~93 Model→Model relations):
  • **Monitoring\NodeService → Lab\Section (FULL):** new `Monitoring/Adapters/LaboratoryAdapter`
    (`activeSectionsForSelect(): Collection<int,array{id,name}>`) backed by new
    `Laboratory\SectionRepository::getActiveOrdered()`. `getSectionsForSelect` is now a one-line
    adapter delegate; the `Section` import is gone. (`MonitoringNode::section()` belongsTo relation
    stays — impractical category.) NodeServiceTest constructor updated for the new ctor dep.
  • **Reception\ReportService → Lab\{Method,Test} (FULL):** the two pure passthroughs
    `getMethod`/`getTest` (only caller: CreateReportController) removed; the controller now calls the
    existing `Reception\Adapters\LaboratoryAdapter::{getMethodForAcceptanceItem,getTestForAcceptanceItem}`
    directly (adapters ARE the sanctioned boundary a Reception-context controller may use). ReportService
    keeps the adapter only for `getTemplateUrl`; `Method`/`Test` imports gone.
  • **Billing\DailyCashReportService → Reception\AcceptanceItem (QUERY extracted):** the inline
    `AcceptanceItem::whereBetween(...)->whereHas('test',...)->with(...)->get()` moved to
    `AcceptanceItemRepository::getForCashReport()` via new `Billing/Adapters/ReceptionAdapter`. Dropped
    the `AcceptanceItem` **and** `Laboratory\Enums\TestType` imports from the service. `Acceptance`
    type-hint on the private buildRow/extractPatientNames helpers left (report-formatting logic that
    walks Acceptance→payments/referrer/patient — belongs in Billing; DTO-fication too risky).
  • **Billing\InvoiceComposer → Reception\AcceptanceItem (WRITES extracted):** both
    `AcceptanceItem::whereIn('id',$ids)->update(['invoice_item_id'=>...])` calls routed through
    `ReceptionAdapter::linkAcceptanceItemsToInvoiceItem()` (→ `AcceptanceItemRepository::linkToInvoiceItem`).
    The `Test`/`AcceptanceItem` type-hints on bucketize/kindFor/keyForAcceptanceItem stay (they walk
    `$ai->methodTest->test`, panel_id, price — core invoicing, impractical to DTO-ify).
  Test ctor sites for the two newly-ctor'd Billing services switched from bare `new` to
  `app(...)` (Unit InvoiceComposer + Unit/Feature DailyCash). Left open (unchanged): the pervasive
  `User\Models\User` type-hints (foundational) + the Model→Model cross-domain Eloquent **relations**.

### 12. Performance pass (Medium / Medium) — make the existing generic rule concrete
Verify request-path side effects are queued, not sync (ReportApprovalService, AcceptanceService,
ReorderAlertService all emit notifications); index-audit hot columns on the shared api+lis DB;
confirm large lists paginate. Currently only a generic CLAUDE.md rule with no tracked task.
- ✅ 2026-07-04 (`composer analyse` green; migration verified up→down→up on `lis_test`; relevant
  suites 57/57 green — Notification unit/feature + Inventory PurchaseRequest/ReorderAlert +
  Reception ReportApprovalFlow/AcceptanceService; Pint deliberately skipped per [[project_ci_checks]]
  — the 6 touched notification files are pre-existing-noisy, edits are +2 lines each). Three tracks:
  **(A) Queue request-path side effects — the real win.** Audited every `Notification`/`Listener`/
    `Job`. The event listeners were already correct: the 7 `Notify*` provider listeners are thin sync
    dispatchers of already-`ShouldQueue` webhook Jobs (`SendXWebhook`), the Referrer webhook listeners +
    `SendPatientToProviderWebhook` are `ShouldQueue`, and the Reception listeners (invoice/pricing/
    payment/reported) do only synchronous **DB** business logic that must stay in-request for
    consistency (no external I/O). The gap was **6 notifications that did external I/O (SMS/WhatsApp/
    mail) synchronously on the request path** — now `implements ShouldQueue` (all already used the
    `Queueable` trait, so +1 import +1 interface each; QUEUE_CONNECTION defaults to `database`, so this
    is effective, and mirrors the already-queued `ReferrerReportPublished`/`WelcomeNotification`):
      • `Reception\PatientReportPublished` (Omantel SMS + Twilio WhatsApp) — fired on acceptance publish
        (`AcceptanceService::sendPublishedNotifications`); previously two blocking external API calls per
        publish, per patient.
      • `Inventory\ReorderAlertNotification` (mail) — fired from `StockMutationService` on every stock
        movement that trips the reorder level (request path).
      • `Inventory\PurchaseRequest{Approved,Rejected,StepPending}Notification` (mail) — fired inline in
        `PurchaseRequestWorkflowService` approve/reject/delegate actions.
      • `Inventory\PurchaseRequestOverdueNotification` (mail) — fired from the
        `EscalateOverduePurchaseRequestSteps` scheduled command; queueing keeps the batch from blocking
        on SMTP per PR.
  **(B) Index audit — 2 high-value gaps added** (`2026_07_04_120000_add_hot_column_indexes`). The prior
    `2026_04_30` perf migration already covered `acceptances.status`, `reports.{approved_at,published_at}`,
    `samples.status`, `referrer_orders.status`, `acceptance_item_samples.active`; FKs are indexed via
    `constrained()`; `patients.idNo` is `unique`. Remaining hot columns lacking an index:
      • **`samples.barcode`** — point lookup on every barcode scan (`Sample::where('barcode',…)->first()`),
        previously a full scan (stock_lots/item_barcodes/collect_requests barcodes were indexed but the
        `samples` one was not).
      • **`acceptance_item_states(section_id, status)`** composite — the section-workflow dashboards
        filter/count states by `section_id + status` on every load (`Section::{waiting,processing,
        finished,rejected}Items`, `AcceptanceItemStateRepository` filters). `section_id` alone was the
        FK index; the composite lets the `status` predicate use the index too, and its leftmost prefix
        still backs the FK (so `down()` drops it and the FK falls back to `section_id_foreign` — verified
        on a properly-migrated schema).
      Skipped as low-value: `reports.status` is a low-selectivity **boolean** and the hot report lists
      already drive off the indexed `approved_at`/`published_at`; `acceptances.created_at` range-filters
      are secondary to the id-desc order + already-indexed `status`, not worth the write cost on a hot
      insert table.
  **(C) Pagination — already satisfied, confirmed.** Every user-facing `list*` repository method returns
    a `LengthAwarePaginator` (`->paginate($queryData['pageSize'] ?? 10)`); the handful of `Collection`
    returns are intentionally bounded (dropdown lookups `all()`, exports `listAll*`/`exportAcceptances`,
    the calendar `listCollectRequestsForCalendar`). No unbounded user-facing list found — nothing to fix.
  NOTE (flagged, not changed — out of scope for a perf pass, it's a product/behavior decision): the 5
    Inventory notifications send `via() = ['database','mail']`, which contradicts the project convention
    "staff/internal notifications: database channel only, never email" ([[feedback_internal_notifications]]).
    Dropping `mail` there would stop those emails — left for the maintainer to decide; queueing already
    moves the mail off the request path regardless.

### 13. Fix the flagged-but-unfixed latent bugs (High / Low)
Concrete correctness defects that earlier items *identified and left*, not "missing type" noise.
Fix at source, drop any masking baseline entry, add a regression test each.
- ✅ 2026-07-05 (`composer analyse` green — baseline **one real entry removed**, none added; new tests
  5/5 green; Laboratory + Inventory feature suites **214/214** green; Pint skipped per [[project_ci_checks]]
  — surrounding files are pre-existing double-quote/aligned-array noise, my edits match that style):
  • **Broken search filters (from #8, lines 639-642) — `BadMethodCallException` on any search.**
    `OfferRepository` and `ReportTemplateParameterRepository` called `$query->search(["name"], …)`, but
    neither `Offer` nor `ReportTemplateParameter` **used** the `Searchable` trait (so `scopeSearch` didn't
    exist → hard throw) **and** neither table has a `name` column (both are `title`). Fixed both: added
    `use App\Traits\Searchable;` to the two models + corrected `["name"]` → `["title"]` in the two repos.
    Confirmed against the migrations (offers/report_template_parameters both `->string('title')`, no `name`).
  • **`OfferRepository` referrer filter — `RelationNotFoundException` (adjacent, same method).** The
    `referrer_id` filter did `whereHas("referrer_id", …)`, but the relation is `referrers()` (there is no
    `referrer_id` relation) → any `referrer_id` filter threw. → `whereHas("referrers", …)`.
  • **`EscalateOverduePurchaseRequestSteps` — one bad role name aborted the whole batch (from #7, lines
    586-588).** `Role::findByName($step->approver_role, 'web')` **throws** when the role is missing; the
    author's `if ($role)` null-guard was therefore dead (always-true, and it was baselined `if.alwaysTrue`),
    and because the loop is inside a single try/catch, a missing role → command `FAILURE`, remaining overdue
    steps unprocessed. → query `Role::where('name', …)->where('guard_name','web')->first()` (returns null →
    the existing guard now works → skip that step, continue). Removed the now-dead `if.alwaysTrue` baseline
    block (real fix, not suppression).
  • **`escalated` never persisted (discovered while testing the command).** `PurchaseRequestApproval`
    doesn't list `escalated` in `$fillable`, so `$approval->update(['escalated' => true])` **silently
    dropped it** → store managers were re-notified on every run, defeating the `if (!$approval->escalated)`
    guard. Fixed via direct assignment (`$approval->escalated = true; $approval->save();`) rather than
    widening the mass-assignment surface.
  Tests: `tests/Feature/Laboratory/SearchFilterFixTest.php` (3 — Offer search filters by title without
    throwing, Offer `referrer_id` filter no longer throws, RTP `search(["title"], …)` scope filters) and
    `tests/Feature/Inventory/EscalateOverduePurchaseRequestStepsTest.php` (2 — unknown role name → exit 0 +
    `escalated` persisted; a valid role still notifies its users). The exit-code assertion genuinely
    discriminates the fix (old throwing finder → exit 1).
  NOTE (not changed): `ReportTemplateParameterRepository::applyFilters` is `protected` with no public
    `list*` caller, so its search path is currently unreachable — the trait/column fix is still correct and
    the RTP test pins the model scope directly against future callers.

### 14. Type the Exports layer — the `$row->alias` selectRaw shape cluster (Medium / Medium) — closes #8's deferred Export tail
The single largest remaining coherent baseline cluster: **42 of the 182 baseline blocks (23%)** live in
`app/Domains/*/Exports/`, concentrated in 5 files. They were deferred throughout #1/#8 as "audit
individually" because a naive `$row`-to-concrete-model type-hint *swaps* base-`Model::$x` errors for
`Concrete::$alias` errors (a regression) — the aliases are `selectRaw`/`withCount` columns that don't exist
as real `@property`, and some rows are hand-built `(object)[…]` `stdClass` (not models at all). This is a
self-contained, high-yield slice with a clear DDD-aligned fix.

Cluster (measured 2026-07-05, `grep` over `phpstan-baseline.neon`):

| File | Blocks | Identifiers |
|------|-------:|-------------|
| `Reception/Exports/AcceptanceItemsExport.php` | 26 | property.notFound=15, missingType.parameter=6, argument.templateType=4, missingType.return=1 |
| `Laboratory/Exports/TestExport.php` | 6 | missingType.parameter=5, match.alwaysTrue=1 |
| `Laboratory/Exports/ReportTemplateParameterExport.php` | 3 | property.notFound=2, argument.templateType=1 |
| `Reception/Exports/AcceptancesExport.php` | 3 | argument.templateType=2, missingType.parameter=1 |
| `Reception/Exports/DailyReceptionReportExport.php` | 2 | argument.templateType=2 |

Root cause (confirmed in `AcceptanceItemsExport`): `map($row)` + the private formatters receive `$row`
typed `mixed`/base-`Model`/`object`, then read `selectRaw` aliases — `$row->patient_fullname`,
`patient_idno`, `patient_dateofbirth`, `test_testsname`, `method_name`, `method_turnaround_time` — and
`mergeAcceptanceItems()` pushes a `(object)[…]` `stdClass` with the *same* shape for merged panel rows. So
`$row` is genuinely `AcceptanceItem|\stdClass`, and neither carries the alias columns as declared props.
The untyped `map`/formatter params drive `missingType.parameter`; the alias reads drive `property.notFound`;
the untyped `collect($grouped)`/`flatMap` calls drive `argument.templateType`.

Recommended approach (DDD-aligned, per CLAUDE.md "DTOs over loose arrays/objects across layers"):
1. Introduce one typed read-model per export shape (e.g. `Reception/Exports/Rows/AcceptanceItemExportRow`,
   a `readonly` value object with the alias columns as typed props). Normalize *both* the model-backed rows
   **and** the merged `(object)` branch into it in `collection()`/`mergeAcceptanceItems()`. Then
   `map(AcceptanceItemExportRow $row): array` + typed formatter params clear `missingType.parameter`, the
   typed props clear `property.notFound`, and `Collection<int,AcceptanceItemExportRow>` clears the
   `collect()`/`flatMap` `argument.templateType` (give the collection helpers explicit generics).
2. Lighter fallback where a DTO is overkill (single-shape, model-only exports like `TestExport`): add
   `@property-read` alias docblocks to the source model (or a local `/** @param … */` object-shape) and type
   the formatter params — but do NOT bare-type `$row` to the concrete model without the alias `@property`
   (that's the documented regression trap).
3. `TestExport`'s `match.alwaysTrue` is the same audited-benign defensive-`default` arm noted under #7 —
   keep it baselined or drop the redundant arm; not part of the typing fix.

Method: reuse the proven measured-cluster loop (baseline-free `phpstan-measure.neon` → `--error-format=json`
→ path-keyed diff to catch cascades/line-shift false positives → regen into root `phpstan-baseline.neon` per
checkpoint). Per-file, measure net after each. Watch for the alias-swap regression on every `$row` typing.

Acceptance criteria:
- `composer analyse` green; baseline drops ~40 (182 → ~142), **no new/unmatched entries**.
- Export feature/unit coverage green (the exports have existing tests — `AcceptanceItemsExport` et al.);
  add a test if the DTO normalization changes any row-shaping path (behavior must be byte-identical).
- Pint skipped per [[project_ci_checks]] if the touched files are pre-existing-noisy and edits are
  typed-signature/docblock-only; otherwise Pint the *new* Row/DTO files.

Out of scope (incidental Export stragglers, audit individually — NOT the alias-shape cluster):
`TransactionHistoryExport` (1 × `return.type`) and `ReferrerTestExport` (1 × `nullsafe.neverNull`, kept by
convention). `DailyReceptionReportExport`'s 2 entries are pure `collect()` template-type and may clear for
free once its row source is typed.
- ✅ 2026-07-05 (`composer analyse` green — **baseline 182 → 147 blocks**, −35; full suite **627/1504**
  green, incl. a new export test; no new distinct baseline entries — the only count change is a
  documented benign one). Cleared the cluster's typeable core:
  • **`AcceptanceItemsExport` (−26, the whole file).** Root cause was the untyped `mergeAcceptanceItems`
    (`$first`/`$item` = base `Model`) plus `map(mixed $row)` where `$row` was genuinely
    `AcceptanceItem|\stdClass` (the hand-built `(object)` merged panel row). Introduced a typed
    **`Reception/DTOs/AcceptanceItemExportRow`** readonly value object with two factories
    (`fromAcceptanceItem`, `fromMergedGroup`); both merge branches now produce it, so `collection()`
    returns `SupportCollection<int, AcceptanceItemExportRow>` and `map()`/every helper type `$row` to the
    DTO. Added the 6 `withAggregate` alias `@property-read`s (`patient_fullname`, `patient_idno`,
    `patient_dateofbirth`, `test_testsname`, `method_name`, `method_turnaround_time`) to the `AcceptanceItem`
    model + generic-typed `mergeAcceptanceItems`. `invoice`/`acceptance` kept `mixed` on the DTO on purpose:
    `invoice` is a Billing model reached only to hand to `BillingAdapter`, so the Reception layer must not
    import it (layering rule). New **tests/Feature/Reception/AcceptanceItemsExportTest.php** (2 tests, DB-free
    — relations pre-set so the `status` accessor never queries) pins the single vs merged row mapping +
    price/discount summation + tag union (the refactored path).
  • **`TestExport` (−5 `missingType.parameter`; the file's blocks 6 → 1).** Typed the 4 `$method` params
    (`Method`, same domain) + `configureSheet(Worksheet)`, and added `Collection<int, MethodTest>` generics to
    the two multiple-price helpers so `$methodTest->method` resolves at the call sites. The `AfterSheet`
    event's `$event->sheet` is a `Maatwebsite\Excel\Sheet` wrapper, not a `Worksheet` — passed
    `->getDelegate()` (exactly what the runtime `__call` forwards to; behavior identical) so the type is
    honest. Side effect: typing `$method` made 4 more `match($method->price_type)` arms analyzable → the
    **`match.alwaysTrue` count grew 2 → 6** — the *identical* "defensive `default` on a fully-covered enum"
    pattern #7 already deliberately kept baselined for this file, so growing that accepted-benign count (not a
    new distinct entry) is consistent; net TestExport still drops 5 blocks.
  • **`ReportTemplateParameterExport` (−3).** Generic-typed the constructor `Collection<int,
    ReportTemplateParameter>` → `$item->title`/`$item->id` + the `->map()` `TMapValue` all resolve.
  • **`AcceptancesExport` (−1).** Typed `formatTests(Acceptance $row)` (touches only the `acceptanceItems`
    relation → zero regression).
  DEFERRED (unchanged, documented cascade/staudenmeir tail): `AcceptancesExport`'s 4 `collect($row->tags/
  ->samples)` template-types (`map()`'s `$row` would need 5 more alias `@property-read`s **and** its
  `samples()` is the deferred staudenmeir `HasManyDeep`) and `DailyReceptionReportExport`'s 2
  `collect($this->report[...])` (needs a fragile array-shape doc on the untyped `array $report`) — both are
  the codebase-wide-deferred `collect($mixed)` family. The 2 incidental stragglers
  (`TransactionHistoryExport` `return.type`, `ReferrerTestExport` `nullsafe.neverNull`) also left. Pint not
  run on the pre-existing-noisy Export files per [[project_ci_checks]] (edits are typed-signature/docblock
  only); the new DTO matches the aligned-constructor house style of its `Reception/DTOs` neighbors.

---

## Round 2 — fresh review (2026-07-05)

Round 1 (#1–#14) exhausted the **types / layering / decomposition / exports / perf-index** axes.
This round is a fresh sweep on axes Round 1 never touched: **authorization coverage, error-handling
hygiene, production resilience, and frontend fault-tolerance**. Every finding below was ground-truthed
against the current tree (grep counts + file inspection), not carried over from Round 1.

| # | Area | Severity | Effort |
|---|------|----------|--------|
| 15 | `dd()` in a production catch + ~31 error-swallowing catch blocks | High | Low |
| 16 | `Model::preventLazyLoading()` unconditional → production 500 risk | High | Low |
| 17 | Authorization coverage unaudited — 110/197 controllers make no authz call | High | Medium |
| 18 | Workflow/financial authz is ad-hoc service throws, gated only by `viewAny` | Medium | Medium |
| 19 | Frontend fault-tolerance — 4 ErrorBoundaries across 670 components | Medium | Low |
| 20 | Notification channel convention violation (5 Inventory notifs mail internally) | Low | Low |
| 21 | Unit-test density — 8 unit files for 81 services; whole tiers at 0 | Medium | Medium |

---

### 15. Kill the production `dd()` + triage silent catch blocks (High / Low)
`app/Domains/Reception/Services/AcceptanceService.php:760` runs **`dd($exception, $sampleIndex, $sample,
$item->customParameters["samples"])` inside a `catch`** on the pooling / sample-grouping path. If that
block ever throws, the request **dumps internals and dies** (leaks patient sample data + a 500 with no
JSON envelope) and the real exception is swallowed with zero logging. Fix at source: log + rethrow (or a
domain exception), never `dd`.
- Broader hygiene: a scan found **31 of 74 `catch` blocks** that neither `Log::`, `report()`, nor
  `throw` — some legitimately return `back()->with('error', …)` (user feedback), but the swallowers
  (e.g. `MocreoService.php:25`, `ReferrerTestService.php:111/122`, `PermissionRepository.php:34`) hide
  failures. Audit each; log-or-rethrow the genuine swallows.
- Regression guard: add `dd`/`dump`/`var_dump`/`ray` to a disallowed-calls check (PHPStan
  `disallowedFunctionCalls` extension, or a cheap CI grep test) so this can't come back — mirrors what
  #6 did with `no-console` on the frontend.
- ✅ 2026-07-05 (`composer analyse` green; Reception + code-quality suites **161/161** green). Replaced
  the `dd()` in `AcceptanceService::convertAcceptanceItems` (:760) with `Log::error(...)` (safe context
  only — acceptance_item_id + sample_index + exception message, **no PHI payload**) + `throw $exception`,
  so the failure is observable and no longer dumps sample data to the response. Added the regression
  guard as a dependency-free PHPUnit test (**`tests/Unit/CodeQuality/NoDebugFunctionsTest.php`**) that
  scans `app/` for `dd`/`dump`/`var_dump`/`ray` call-forms and fails with the offending file:line — the
  PHP-side counterpart to the frontend `no-console` rule; runs in the existing CI PHPUnit job, no new dep.
  STILL OPEN (the secondary hygiene sub-item, not done here): the broader triage of the ~31 non-logging
  `catch` blocks — the true swallowers (`MocreoService:25`, `ReferrerTestService:111/122`,
  `PermissionRepository:34`) should log-or-rethrow; the `back()->with('error', …)` ones are legit user
  feedback and stay. Tracked as a follow-up under this item.
- ✅ 2026-07-09 — the open tail (silent-catch triage) completed under item #30; #15 is fully closed.

### 16. Guard `Model::preventLazyLoading()` for production (High / Low)
`app/Providers/AppServiceProvider.php:129` calls `Model::preventLazyLoading()` **unconditionally**. In
non-prod that's ideal (catches N+1 loudly), but in **production every un-eager-loaded relation access
throws `LazyLoadingViolationException` → a hard 500 for the user.** Only **4 of 19 Resources** use
`whenLoaded`, and there are 197 controllers, so the odds that some rarely-hit path lazy-loads in prod are
real. Decide between:
- `Model::preventLazyLoading(! $this->app->isProduction())` — loud in dev/staging, silent-degrade in prod
  (the common Laravel idiom), **or**
- keep it strict but register `Model::handleLazyLoadingViolationUsing(fn (…) => report(…))` so prod
  reports instead of 500-ing.
Trivial change; the value is picking the policy deliberately rather than shipping the accidental default.
- ✅ 2026-07-05 (`composer analyse` green). Chose the standard idiom — `AppServiceProvider::boot()` now
  calls `Model::preventLazyLoading(! $this->app->isProduction())` (matches the existing
  `$this->app->environment('production')` check two lines above). Dev/staging still fail loud on N+1;
  production degrades to a lazy-load (an N+1, still caught by the existing slow-query listener if slow)
  instead of a `LazyLoadingViolationException` 500. The `whenLoaded`-adoption gap in Resources (4/19) is
  real but separate — an eager-load-correctness task for the perf/authz audit, not this prod-safety guard.

### 17. Authorization coverage audit — build the authz matrix (High / Medium)
**110 of 197 controllers make no `$this->authorize()` / `Gate` / `->can()` call** (Reception 26,
Api/Laboratory 13, Referrer 9, Notification 8, Inventory/Api 11…). Routes are wrapped only in
`['auth','verified']` (one lone `can:` in all of `routes/`), and **47 FormRequests `return true`** from
`authorize()`, so for those 110 controllers the enforced-authz surface is whatever the controller does —
and it does nothing. Many are legitimately open (dropdown lookups, self-scoped reads, dashboards), but the
set has **never been audited**, and 26 of them are in Reception (patient/acceptance/sample/report — PHI).
- Deliverable: a route→ability matrix. For every **mutating or PHI-exposing** action confirm a Policy gate
  (43 policies already exist; coverage is uneven). Close the real gaps; explicitly annotate the
  intentionally-public ones (e.g. a `// authz: public lookup` note) so the next audit is cheap.
- Start with Reception + the `Api/*` controllers (machine-facing, easiest to forget).
- ✅ 2026-07-05 (`composer analyse` green; full suite **635/1512** green, +8 new authz tests). Built the
  route→ability matrix (**docs/authz-matrix.md**) covering all 197 controllers. Re-scan corrected the raw
  count: including `middleware('permission:…')` gating **107** controllers have no controller-level authz,
  but many enforce via their **FormRequest** `authorize()` — the true gaps were narrower. Closed **31**
  mutating/PHI gaps by mapping each to an already-seeded permission (no `Gate::before` exists, so an
  unseeded gate would lock everyone out): Reception item-conversion/publish/export/list/relative/barcode
  actions → Acceptance/Report/Patient abilities; `Api/*` PHI+financial reads (patient/acceptance/invoice/
  role lists, GetInvoice) → their `viewAny`/`view`; Billing exports (daily-cash/invoices/statement) →
  Payment/Invoice/Statement listing; Document batch-update/public-upload → Document edit/create;
  ListUsers/GetUserDetails → User listing; ImportController (PHI bulk) → create Acceptance; Referrer
  GetPatientAcceptances/CopyReferrerTests/ReferrerTestController writes → Acceptance/Referrer abilities.
  **Latent bug found & fixed:** `AcceptancePolicy::viewAny` checked `"…List Acceptances"` (plural) — a
  string nobody grants (seeder + `routes.jsx` both use singular `"List Acceptance"`), so the main
  Acceptances index 403'd correctly-seeded users; corrected to the canonical singular. New
  `tests/Feature/Authorization/AuthorizationGateTest.php` pins deny-without / allow-with on 4 representative
  endpoints. **Left open (documented, need a product decision):** `AcceptanceItemState@show` (no read
  ability — folds into #18), `Inventory/UnitController` writes (no unit permission is seeded), the
  `StoreOrderMaterials` no-op stub. Intentionally-public lookups (dropdowns), self-scoped Notification
  actions, and Auth flows annotated in the matrix. Did NOT run Pint (edits are authorize calls + docblock
  imports; CI doesn't run Pint).

### 18. Move workflow/financial authz from service throws to Policies (Medium / Medium)
`PurchaseRequestController`'s `approveStep` / `rejectStep` / `delegateStep` / `bulkApprove` / `recall`
authorize on **`viewAny`** (line 173/192/203/214/226) — i.e. the policy gate is merely "can see the list."
The real approver-identity check lives in `PurchaseRequestWorkflowService` as `RuntimeException`s
(`userCanActOnApproval` at :75/:95/:147, requester check at :178). It's **not an open hole** (the service
guards it), but it **violates CLAUDE.md "authorize via Policies, not ad-hoc checks"**, the `viewAny` gates
are misleading, and there's no separation-of-duties at the policy layer (`order`/`pay`/`ship` all gate on
`create`). Introduce granular abilities (`approve`, `pay`, `ship`) + a `PurchaseRequestApprovalPolicy`
(`approveStep($user, $pr)` encoding the approver rule), keep the service throw as defense-in-depth, and
add a feature test that a non-approver gets 403 at the policy layer, not a 500 from the service.
- ✅ 2026-07-05 (`composer analyse` green, no new baseline; full suite **643/1524** green, +8 new authz
  tests). Moved the workflow authz to the policy layer: new **`PurchaseRequestApprovalPolicy`**
  (`approveStep`/`rejectStep`/`delegateStep` → `WorkflowService::canAct` approver-identity; `recall` →
  requester + SUBMITTED; `bulkApprove` → coarse Approve permission). Since `PurchaseRequest` already has
  `PurchaseRequestPolicy` (Laravel allows one `Gate::policy` per model), the approver abilities are
  registered as `Gate::define('purchase-requests.*', PurchaseRequestApprovalPolicy::class.'@method')` —
  the container-resolved string form so the policy's workflow-service dep is injected. Controller's five
  workflow actions now `authorize()` those abilities instead of the misleading `viewAny`; the service
  `RuntimeException`s stay as defense-in-depth (and to guard the in-transaction race). **Separation of
  duties:** added granular `order`/`pay`/`ship` methods to `PurchaseRequestPolicy` backed by new
  `Inventory.PurchaseRequests.{Order,Pay,Ship} Purchase Request` permissions (were all gated on `create`);
  seeded via the keyword filters to the same roles that hold Create, so effective access is unchanged but
  a role can now create-without-pay. New **`tests/Feature/Inventory/PurchaseRequestAuthorizationTest.php`**
  (8 tests) pins: non-approver→403 (not a 302-with-error from the caught service throw), step-approver
  succeeds (PR→APPROVED), non-requester recall→403, requester recall→DRAFT, bulk-approve without
  permission→403, pay without Pay permission→403 / with→passes.
  Also closed the two #17 residuals folded here: **`AcceptanceItemStateController@show`** (PHI read) now
  `authorize('view', $section)` (section-scoped `SectionPolicy@view`, consistent with the mutation `action`
  gate); **`Inventory/UnitController`** index/store/update/destroy gated by a new `UnitPolicy` +
  `Inventory.Units.{List,Create,Edit,Delete}` permissions (seeded + role-granted). authz-matrix.md updated
  (residuals → "Closed by plan #18"). Did NOT run Pint (edits are authorize calls / policies / seeder rows;
  CI doesn't run Pint).

### 19. Frontend fault-tolerance — Error Boundaries (Medium / Low)
Only **4 files** across **670 `.jsx`** reference an error boundary. With Inertia, an uncaught render error
in any page component **white-screens the whole app** (no fallback UI). Add a layout-level `ErrorBoundary`
in `AuthenticatedLayout` (fallback card + "reload") wrapping the page slot, plus boundaries around the
heaviest async widgets (Drawing/PaintApp/charts). Secondary, lower value: **PropTypes on only 45/670**
components — for a JS (non-TS) codebase that's the only runtime prop contract; adopt it (or JSDoc
`@param`) at least on the shared `Components/` surface, and consider an ESLint `react/prop-types` nudge.
- ✅ 2026-07-05 (eslint + prettier clean, `vite build` green, vitest **58/58** incl. +5 new). Reworked the
  single app-root `ErrorBoundary` (was full-viewport only, wrapping the whole `<App>` in app.jsx → any page
  throw replaced the *entire* UI) into a **3-variant** boundary: `page` (unchanged full-viewport last-resort,
  still at the app root), `inline` (fills the content region only), `widget` (compact outlined card). Added a
  **`resetKeys`** prop — `componentDidUpdate` clears the error state when a key changes — so the boundary
  recovers on navigation instead of sticking. Wired an **`inline`** boundary around the page slot in
  `AuthenticatedLayout` (`resetKeys={[currentRoute]}` = `usePage().url`): an uncaught render error in any page
  now shows a fallback card *inside* the main region with nav/drawer still usable, and navigating away
  auto-recovers. Wrapped the three named heavy widgets with `widget`-variant boundaries at their export/wrapper
  seams (so every usage is covered): `Drawing.jsx`→`PedigreeChartWrapper`, Consultation
  `PaintApp.jsx`→new `ReactPaintMUIWithBoundary`, `Billing/BillingCharts.jsx` (wraps the recharts sections).
  Each fallback offers "Try again" (resets the boundary) and, for page/inline, "Refresh Page". Dev-only stack
  trace preserved. New `tests/…/ErrorBoundary.test.jsx` (5 tests): renders children, shows fallback on throw,
  widget custom title/desc + Try-again, retry recovery, and resetKey-change auto-reset. The existing
  `SingleDocumentViewer/ErrorBoundary` (its own scoped boundary) left as-is.
  DEFERRED (the secondary, lower-value half — its own slice): the codebase-wide **PropTypes / `react/prop-types`
  nudge** on the shared `Components/` surface.

### 20. Resolve the notification-channel convention violation (Low / Low) — carried from #12 ✅
Round 1 #12 flagged but deliberately left this for the maintainer: **5 Inventory notifications send
`via() = ['database','mail']`** (`ReorderAlert`, `PurchaseRequest{Approved,Rejected,StepPending,Overdue}`)
— contradicting the project rule *"staff/internal notifications: database channel only, never email"*
([[feedback_internal_notifications]]). Decide and encode it: either drop `'mail'` (align with the rule) or
formally exempt Inventory purchasing (its approvers may be off-system) with a comment + a memory update.
One-line change either way; the point is to stop the convention drifting silently.
✅ 2026-07-05 — **aligned with the rule (dropped `'mail'`)**: all 5 notifications now `via() = ['database']`;
      removed each `toMail()` method + the now-unused `MailMessage` import. `composer analyse` green; the two
      touched suites (EscalateOverduePurchaseRequestStepsTest + PurchaseRequestWorkflowServiceTest) 17/17 green
      (they assert *that* the notification is sent, not the channel — no test change needed). Staff PR-approval &
      reorder alerts are in-app only now, consistent with [[feedback_internal_notifications]].

### 21. Raise unit-test density on the untested service tier (Medium / Medium) — extends #4/#9
**8 unit files for 81 services.** Whole tiers have **zero pure-unit coverage**: Laboratory (18 services),
Consultation (4), User (4), Monitoring (2) — their Feature tests reach the leaf pricing / eligibility /
state-machine logic only transitively. Target the DB-free decision functions (the Round 1 #9 pattern:
private helpers via reflection / in-memory models) in the next risk tier — e.g. workflow progression
& section-access rules (Laboratory), consultant scheduling/slot math (Consultation), RBAC section-scoping
(User/Role). Fast, deterministic, and they pin the exact branches Feature tests gloss over.

- [x] ✅ 2026-07-05 first slice — section-access + RBAC scoping (3 new pure-unit files, +16 tests /
      45 assertions; full Unit suite **69 → 85**, `composer analyse` green). Opened the two previously
      zero-coverage tiers (Laboratory, User) by pinning the exact Gate/id-substitution branches the
      Feature suite only reaches transitively:
      • `tests/Unit/User/RoleServiceTest.php` — RBAC section-scoping: `getSectionAndGroupSections`
        (numeric section/group id → name rewrite via a stand-in `SectionLookupInterface`; Section vs
        group-vs-Dashboard branches; section-perms merged ahead of untouched non-section perms) +
        `getName` (recursive undot→{name,id,children} tree, leaf-without-children case).
      • `tests/Unit/Laboratory/SectionGroupServiceTest.php` — sidebar access tree: `transformGroups`
        (viewable group emits route + only viewable sections; **non-viewable group with a viewable
        descendant is kept route-less, else pruned**; recursive children re-typed 'group'),
        `extractRoutes` (nested walk, route-less nodes skipped), `generateBreadcrumbs` (root-first order).
      • `tests/Unit/Laboratory/SectionServiceTest.php` — `prepareAccessibleSections` (groups viewable
        sections, drops denied ones, nests child group under its parent via `section_group_id`, falls
        back to root when the parent group is absent).
      Pattern: reflection into protected/private helpers + `Gate::shouldReceive('allows')` facade mock +
      in-memory models with relations pre-set via `setRelation`/`forceFill` (no DB, no lazy loading).
      Remaining open: Consultation slot/scheduling math + Monitoring, and the Laboratory service tail.

---

**Round 2 status:** **#15 + #16 + #17 + #18 landed** (2026-07-05 — the prod-hardening pair
`dd()`/`preventLazyLoading`, then the authz-coverage audit: route→ability matrix in `docs/authz-matrix.md`,
31 mutating/PHI gaps closed + one latent `AcceptancePolicy::viewAny` permission-string bug fixed; then #18
moved the PurchaseRequest workflow/financial authz to the policy layer — `PurchaseRequestApprovalPolicy` +
granular `order`/`pay`/`ship` abilities — and closed #17's two residuals: `AcceptanceItemState@show` gated on
section `view`, `Inventory/UnitController` on a new `UnitPolicy`. `composer analyse` green, suite 643/1524.)
**#19 landed** (2026-07-05 — frontend fault-tolerance: 3-variant `ErrorBoundary` with `resetKeys`,
`inline` boundary around the layout page slot + `widget` boundaries on Drawing/PaintApp/BillingCharts;
+5 vitest, 58/58, build green). The secondary PropTypes/`react/prop-types` half was deferred.
**#20 landed** (2026-07-05 — notification-channel convention: dropped `'mail'` from the 5 Inventory
notifications, now `via() = ['database']` only, `toMail()`/`MailMessage` removed; aligns with the
database-only staff-notification rule. analyse green, touched suites 17/17).
**#21 first slice landed** (2026-07-05 — opened the two zero-coverage tiers, Laboratory + User, with
pure-unit coverage of the section-access tree (`transformGroups`/`prepareAccessibleSections`) and RBAC
section-scoping (`RoleService`); +16 tests, Unit suite 69→85, analyse green).
Remaining open: **#21** tail (Consultation slot/scheduling math, Monitoring, the Laboratory service
tail), plus the #15 follow-up (silent-catch triage) and the deferred #19 PropTypes nudge which can ride along.

---

## Round 3 — fresh review (2026-07-09)

Structural pass focused on the **Adapter boundary rule** (CLAUDE.md: *"Adapters — the only way one domain
talks to another. NEVER import another domain's Service/Repository/Model directly across domains."*) plus
two carried-over layering/SRP smells. Findings ranked by fix value (self-contained + rule-enforcing first).

| # | Area | Severity | Effort |
|---|------|----------|--------|
| 22 | Reception invoice **listeners bypass the existing `BillingAdapter`** | Medium | Low |
| 23 | `AcceptanceRepository` calls `Setting\Services\SettingService` (repo → cross-domain service) | Medium | Low |
| 24 | `Document` **model** calls `User\Services\UserService` (model → cross-domain service) | Medium | Low |
| 25 | `ItemImportController` (273 LOC) builds XLSX templates inline (fat controller) | Medium | Low |
| 26 | Oversized services: `AcceptanceService` 963 LOC, `ReportService` 785 LOC (SRP) | Medium | High |
| 27 | Largest React components: `Drawing.jsx` 890, `Upload.jsx` 681, `PaintApp.jsx` 569 | Low | Medium |

Note on cross-domain **Model** coupling (200+ direct imports, worst: Inventory/Reception → `User::Models`):
this is the same class of debt tracked by Round 1 #3 / #11 and is deliberately *not* re-opened as a new item
— #22–#24 target the sharper **Service/Repository** crossings that bypass adapters which already exist.

### 22. Reception invoice listeners bypass the existing `BillingAdapter` (Medium / Low)
`Reception/Adapters/BillingAdapter` already exists, yet two listeners reach into Billing's services directly:
- `Reception/Listeners/AcceptanceInvoiceListener.php` → `Billing\Services\InvoiceComposer` + `InvoiceService`
- `Reception/Listeners/AcceptanceItemPricingListener.php` → `Billing\Services\InvoiceComposer`

Route both through `BillingAdapter` (extend its surface if a method is missing). Lowest-risk win — the adapter
is there, the listeners just skip it. Keep behavior identical; adjust/add listener tests.

- [x] ✅ 2026-07-09 — extended `Reception/Adapters/BillingAdapter` with `findInvoiceById()` +
      `recomposeInvoice()` (now injects `InvoiceService` + `InvoiceComposer` alongside the existing
      `InvoiceRepository`), and repointed both listeners at the adapter. `Billing\Services\*` is now imported
      **only inside the adapter** — no Reception listener/repo/service reaches into Billing directly. Behavior
      identical (same `findInvoiceById`→`recompose` sequence). New pure-unit `AcceptanceInvoiceListenerTest`
      (3 tests / 12 assertions, Mockery, no DB): recompose-through-adapter happy path, bail-out on missing
      acceptance, skip-recompose on missing invoice. `composer analyse` green (826, no new baseline), Pint clean.

### 23. `AcceptanceRepository` → `Setting\Services\SettingService` (Medium / Low)
`Reception/Repositories/AcceptanceRepository.php` imports another domain's service. Two smells at once: a
**repository** doing cross-domain orchestration, and the crossing bypassing `Reception/Adapters/SettingAdapter`
(which exists). Pull the setting read up to the service layer (via `SettingAdapter`) and pass the value into
the repository, so the repo stays pure query logic.

- [x] ✅ 2026-07-09 — moved the `Payment/minPayment` read out of `AcceptanceRepository::listSampleCollection`
      up into `AcceptanceService::listSampleCollections`, resolved via the already-injected
      `Reception/Adapters/SettingAdapter` (`getSettingByClassAndKey`, itself a passthrough to
      `SettingRepository::getSettingsByClassAndKey` — identical value to the old
      `SettingService::getSettingByKey`). The repo method now takes `float $minAllowablePaymentPercentage`
      as a param and dropped its `SettingService` constructor dependency + import entirely — no Reception
      repository imports `Setting\Services` anymore; the repo is back to pure query logic. New pure-unit
      `AcceptanceServiceSampleCollectionTest` (2 tests / 6 assertions, Mockery, no DB): setting resolved via
      adapter and forwarded as a float, and null-setting → `0.0` threshold. `composer analyse` green (826,
      no new baseline), Pint clean.

### 24. `Document` model → `User\Services\UserService` (Medium / Low)
`Document/Models/Document.php` calls a cross-domain service from inside an Eloquent model — violates both the
"no business logic in models" and the adapter rules. Move the logic to the Document service/adapter seam.

- [x] ✅ 2026-07-09 — introduced `Document/Adapters/UserAdapter` (mirrors the house adapter style, e.g.
      `Inventory/Adapters/DocumentAdapter`) exposing `getAllowedDocumentTags(?User): array`, and repointed
      `Document::scopeAllowedTag` at it via `app(UserAdapter::class)` (models can't constructor-inject, so
      container-resolve at the scope). The model no longer imports `User\Services\*` — the cross-domain hop
      now goes through an Adapter, per the rule. Kept the derivation logic as the single source of truth in
      `UserService::getAllowedDocumentTags` (no move/duplication → lowest risk); the adapter is a thin
      delegate. New pure-unit `tests/Unit/Document/UserAdapterTest` (2 tests, stubbed permission set, no DB):
      only `Documents.*` perms count + snake→UPPER casing, and TEMP/AVATAR excluded. `composer analyse` green
      (827), Pint clean. NOTE (out of this item's scope): `Reception/Http PatientController` still calls
      `UserService::getAllowedDocumentTags()` directly — a separate Reception→User crossing, not the flagged
      model violation; leave for the #3/#11 cross-domain tail.

### 25. `ItemImportController` builds XLSX templates inline (Medium / Low)
`Http/Controllers/Inventory/ItemImportController.php` (273 LOC) has `xlsmTemplate()` + `xlsxTemplate()`
(~120 LOC) constructing spreadsheet templates cell-by-cell — presentation logic in a controller. Extract to
`Inventory/Exports/ItemTemplateExport` (mirror the existing `TestExport`/`MonthlyStatementExport` pattern);
controller just authorizes and returns the streamed response.

- [x] ✅ 2026-07-09 — moved all template-building presentation logic out of the controller into a new
      `Inventory/Exports/ItemTemplateExport`. It owns the `COLS` map, `buildFromScratch()` (plain .xlsx),
      `buildFromBase()` (refreshes the macro-enabled `items-import-base.xlsm`), `addListValidation()`, and a
      `download(): StreamedResponse` that picks xlsm-vs-xlsx exactly as before (same content types, filenames,
      example row, hidden `_units` lookup sheet, `UnitsList` named range and dropdown validations — behavior
      identical). `ItemImportController::template()` is now three lines (authorize → fetch units → delegate);
      the controller dropped from **273 → 91 LOC** and no longer imports PhpSpreadsheet at all. NOTE: unlike
      `TestExport`/`MonthlyStatementExport` this is a *template generator* (dropdowns/named-range/hidden-sheet
      with two output formats), not a data-collection export, so it stays a plain builder rather than
      implementing Maatwebsite's `FromCollection` concerns — forcing those would change behavior. New pure-unit
      `tests/Unit/Inventory/ItemTemplateExportTest` (6 tests / 32 assertions, no DB/HTTP): headers row, example
      row + unit fallbacks, hidden units sheet + named range, enum/unit list validations, and unit-validation
      skip when no units. `composer analyse` green (828, no new baseline), Pint clean.

### 26. Oversized services — `AcceptanceService` (963) / `ReportService` (785) (Medium / High)
Both concentrate multiple responsibilities. Extract cohesive slices (state transitions, pricing orchestration,
sample handling for Acceptance; generation vs. delivery for Report) into focused services. Behavior-preserving,
tests stay green. Higher effort/risk — schedule after the quick wins.

- [x] ✅ 2026-07-09 — split each god-service by responsibility via **facade delegation** (public API and
      constructor signatures preserved, so no consumer/listener/controller changed):
      • `AcceptanceService` **965 → 627 LOC**. Extracted the status state machine into new
        `Reception/Services/AcceptanceStatusService` (`updateAcceptanceStatus`, `checkAndUpdateAcceptanceStatus`,
        `checkAcceptanceReport`, `checkAcceptanceStatus` + the private pooling/service-item/finalize helpers +
        `sendPublishedNotifications`; deps `AcceptanceRepository` + `ReferrerAdapter`), and the barcode-grouping
        view into new `AcceptanceBarcodeService` (`listBarcodes` + `convertAcceptanceItems`; no deps).
        `AcceptanceService` keeps thin public delegators for the five status/barcode methods and builds the two
        collaborators from its own injected deps via **optional trailing ctor params** — so the container injects
        them in prod while the Feature test's 5-arg `new AcceptanceService(...mocks)` still shares the same mock
        instances (zero test churn).
      • `ReportService` **785 → 608 LOC**. Extracted the Word/PDF template data shaping into new
        `Reception/Services/ReportDataService` (`getReportData`, `loadReportRelationships`, `preparePatientData`,
        `getSampleData`, `prepareSigners`, `prepareReferrer`, `prepareParametersData`, `formatDocumentFiles`; no
        deps), injected as a normal ctor dep. Kept delegators only for the two methods with production callers
        (`getReportData` → DownloadReportController, `formatDocumentFiles` → ReportController); the pure shaping
        helpers had **no** production callers (only the unit test), so they moved outright and
        `tests/Unit/Reception/ReportServiceDataShapingTest` was repointed at `ReportDataService`.
      Baseline: relocated the 3 larastan false-positives that moved with the code (2 `collect` argument.templateType
        → AcceptanceBarcodeService, 1 `prepareReferrer` missingType.parameter → ReportDataService) — **net zero, no
        new entries**. `composer analyse` green (831), Pint clean on the new/changed files, full suite **673/1622
        green**. Did NOT run Pint over the two pre-existing service files (CI doesn't run Pint; keeps the diff to the
        actual refactor, no whole-file quote/spacing churn). Remaining `Acceptance*`/`ReportService` bulk is the
        lifecycle/create-update flow (single responsibility each) — no further cohesive slice worth the risk.

### 27. Largest React components (Low / Medium)
`Drawing.jsx` (890), `Upload.jsx` (681), Consultation `PaintApp.jsx` (569). Extract hooks + subcomponents for
testability. Stays JS (no TS). Lowest priority.

- [x] ✅ 2026-07-09 — the three remaining oversized components had already had their *presentational* parts
      split out under #5; the residual bulk was a big block of stateful logic (state + effects + callbacks) in
      each container. Extracted that logic into a dedicated custom hook per component (public props/exports
      unchanged, behavior identical):
      • `Components/Drawing.jsx` **890 → 260** → new `Components/Pedigree/usePedigreeChart.js` (743) owns all
        React Flow graph state, the two sync/emit effects, and every toolbar/editor/modal action; the container
        is now JSX wiring the hook to `<ReactFlow>` + the already-extracted `PedigreeToolbar`/`ElementEditor`/
        modals. Hook stays inside the existing `ReactFlowProvider` (it calls `useReactFlow`). Moved the
        module-level `idCounter`/`getId`/`getFilename` into the hook file; `showNotification` unchanged except
        `handleCloseNotification` now uses the functional `setNotification` updater (drops the stale-`notification`
        dep, same result).
      • `Components/Upload.jsx` **681 → 190** → new `Components/Upload/useFileUpload.js` (552) owns file state,
        parent-sync, upload/delete/tag orchestration and the drag-and-drop `dragEvents`. Also lifted the pure
        `validateFile` (size/type checks) out of the hook into `Upload/helpers.js` so it's unit-testable with no
        React — covered by new `Upload/helpers.test.js` (8 tests: extension/wildcard-MIME accept, oversize,
        disallowed-type, combined errors, empty-accept skip, plus `formatFileTypes`).
      • `Pages/Consultation/Components/Drawing/PaintApp.jsx` **569 → 143** → new `PaintApp/usePaintCanvas.js`
        (496) owns the canvas refs, tool/style state, undo/redo history and all pointer/touch drawing handlers +
        effects; container is JSX wiring the hook to `PaintToolbar`/`NumberToolbox`/`<canvas>`. `getCursor` is now
        a memoized `useCallback` (was a plain fn) so it can be returned from the hook.
      Verified: eslint clean, prettier clean, `vite build` green, vitest **66/66** (was 58; +8 new pure-validator
      tests). NOTE: the plan's stale "35/35" vitest baseline referenced in #5 is now 58 pre-change / 66 after.

## Round 4 — fresh review (2026-07-09)

Full-codebase sweep after Round 3 landed. The heavy structural debt is paid down (baseline 1,608 → 147,
adapter boundary closed at the Service/Repo level except one Shared trait, no `dd()`/`console.log` in live
code, controllers thin, authz matrix gaps closed). Round 4 is a hygiene tier plus one baseline audit likely
to surface real bugs. Findings ranked by fix value.

| # | Area | Severity | Effort |
|---|------|----------|--------|
| 28 | **26 editor backup files (`*~`) tracked in git** (repo hygiene) | Medium | Trivial |
| 29 | `Shared/Traits/LogsUserActivity` → `User\Services` (Shared must not depend on a domain) | Medium | Low |
| 30 | Silent-catch triage — the still-open tail of #15 | High | Low |
| 31 | Webhook job family is copy-paste ×7 (630 LOC, 3 files byte-identical mod entity name) | Medium | Low |
| 32 | Store/Update FormRequest pairs duplicate `rules()` blocks | Low–Medium | Low |
| 33 | Queries inside loops: `ReportService::syncSigners`, `PaymentService::updatePayments` | Low | Low |
| 34 | Baseline final tail (147): audit the 37 `nullsafe.neverNull` entries for lying types | Medium | Medium |
| 35 | `declare(strict_types=1)` adoption is ~8% vs CLAUDE.md mandate — needs a decision | Medium | Medium–High |
| 36 | Frontend next tier: 450–544 LOC components + 33 `Filter.jsx` near-clones + thin test density | Low | Medium |

### 28. Remove the 26 tracked editor backup files (Medium / Trivial)
`git ls-files | grep '~$'` → 26 files: 16 migration copies (`database/migrations/*.php~`), 9 JSX
(`resources/js/Pages/**/…jsx~`, incl. `Section/Components/AddForm.jsx~` which still contains `console.log`s
that greps keep hitting), and `resources/css/app.css~`. They're stale near-duplicates that pollute every
scan/search and could be edited by mistake. `.gitignore` already has `*~` — the files were committed before
the rule existed. Fix: `git rm --cached` (or plain `git rm`) the 26 files; verify nothing imports a `~` path.
- [x] ✅ 2026-07-09 — `git rm`'d all tracked `*~` files (25 remained; the 26th, `Section/Components/AddForm.jsx~`,
      was already removed in `1ebf6d0`): 16 migration copies, 8 JSX, `resources/css/app.css~`. Verified no code
      references a `~` path (incl. `TestTypeSelector.jsx~`, whose live counterpart no longer exists — zero live
      imports) and `.php~` files are inert to the migrator (it globs `*.php`). CORRECTION to this item's premise:
      `.gitignore` did NOT have `*~` — only `*.jsx~` (which is how the php~/css~ copies survived) → broadened the
      rule to `*~` so none of these can be re-committed.

### 29. `Shared/Traits/LogsUserActivity` depends on the User domain (Medium / Low)
`app/Domains/Shared/Traits/LogsUserActivity.php:6,13` — the Shared trait statically calls
`User\Services\UserActivityService::createUserActivity`. Shared should be depended-upon, never depend on a
domain (inverted dependency); it's also the last Service/Repo-level cross-domain crossing outside an Adapter.
Per the house convention (domain side effects are event-driven), fix by dispatching an `ActivityLogged` event
from the trait, handled by a User-domain listener that calls `UserActivityService`. Behavior identical;
add/adjust a listener unit test.
- [x] ✅ 2026-07-09 — trait now dispatches `Shared/Events/ActivityLogged($model, ActionType)` (reused the
      existing `Shared\Enums\ActionType` CREATE/UPDATE/DELETE — no new enum, no User import left in Shared);
      new `User/Listeners/LogUserActivityListener` maps ActionType→ActivityType (exhaustive `match`, fails
      loud on unknown) and calls `UserActivityService::createUserActivity`. Registered sync in
      EventServiceProvider (same-request semantics preserved — activity still saves in the caller's
      transaction context). New tests/Feature/User/LogUserActivityListenerTest.php (3 tests): event→row,
      UPDATE/DELETE mapping, and an anonymous-class trait consumer pinning the full trait→event→listener→DB
      wiring. `composer analyse` green; full suite 676/1626 green. Shared now depends on no domain.

### 30. Silent-catch triage — finish the open tail of #15 (High / Low)
Four truly-empty catch blocks swallow failures with zero logging:
- `Reception/Services/BuildWordFileService.php:169` (`// Ignore header reading errors`)
- `Inventory/Exports/ItemTemplateExport.php:103`
- `Monitoring/Models/MonitoringSample.php:35`
- `Monitoring/Services/MocreoService.php:25`
Plus the known swallowers flagged in #15: `User/Repositories/PermissionRepository.php:34`,
`Referrer/Services/ReferrerTestService.php:111/122`. Audit each: log-or-rethrow the genuine swallows
(`Log::warning` with safe context minimum); keep only deliberate ignores with a comment saying *why* ignoring
is correct. Closes #15 fully.
- ✅ 2026-07-09 (`composer analyse` green; Referrer/User/Monitoring/Inventory + code-quality suites 29/29
  green). Triage outcome per site: **ReferrerTestService:111/122** — the real fix: widened `catch (Exception)`
  → `catch (\Throwable)` (eval parse failures throw `ParseError`, an `Error` the old catch *missed* — a
  malformed admin-configured condition fataled instead of being swallowed) + `Log::warning` with the
  condition/expression string (admin config, no PHI). **PermissionRepository:34** — narrowed bare `Exception`
  to spatie's `PermissionDoesNotExist` (null-on-missing is the method's contract; DB errors now propagate
  instead of masquerading as "permission not found"). **MocreoService:25** — refresh-failure fallback to full
  re-auth now `Log::warning`s (repeated refresh failures were invisible). **BuildWordFileService:169** —
  header-read failure now `Log::warning`s (url + message) before the jpg fallback, since a wrong extension can
  break the generated Word doc. **ItemTemplateExport:103** and **MonitoringSample:35** — kept as deliberate
  ignores with why-comments (idempotent named-range removal; fall-through to Laravel's default date parsing).
  #15 is now fully closed.

### 31. Consolidate the webhook job family (Medium / Low)
`app/Domains/Notification/Jobs/` has 7 `Send*Webhook` jobs (630 LOC total).
`SendInstructionUpdateWebhook` / `SendConsentFormUpdateWebhook` / `SendRequestFormUpdateWebhook` are
byte-identical 88-line files modulo the entity name; `SendSampleTypeUpdateWebhook`,
`SendOrderMaterialUpdateWebhook`, `SendOrderMaterialCreatedWebhook`, `SendCollectRequestWebhook` differ only
in payload shaping. Collapse to one parameterized job (entity type + payload builder/DTO) or an abstract base
with per-entity payload methods — ~500 LOC saved and one place to fix webhook behavior. Keep queue/retry
semantics identical; unit-test payload building per entity.
- [x] ✅ 2026-07-10 (`composer analyse` green; full suite **676/1639** green, Notification suite 29 tests).
  Took the abstract-base route: **`AbstractSendWebhook`** owns the whole send pipeline (HMAC-SHA256 signing,
  domain+path URL joining, `Http::timeout(30)` POST, success/failure logging, rethrow-for-retry), with
  overridable `payload()/webhookUrl()/logContext()/serviceConfig()/headers()/send()`; a `null` payload skips
  the send (used by `SendOrderMaterialCreatedWebhook` when the row is gone). A second tier,
  **`AbstractSendEntityUpdateWebhook`**, captures the provider-app multipart family (payload
  `{key}_id/updated_at/{key}/action` in the original key order so HMAC signatures are byte-identical —
  pinned by the N-01 signature-recompute test — plus optional `document` file attach + `data.json` part).
  The 7 concrete jobs are now 31–72-line declarative subclasses (630 → 326 LOC of per-entity code; 553 total
  incl. both abstracts). Dispatch signatures unchanged, listeners untouched. Queue semantics preserved
  exactly: 3 tries/[10,30,60] for order-material + collect-request, 1 try/[10] for the entity-update family
  (new test N-12 pins this since the base defaults to 3). New tests N-13/N-14 cover the previously untested
  `SendOrderMaterialCreatedWebhook` (payload shape + skip-when-missing). Bonus fixes: the copy-pasted
  `"Order webhook sent successfully", ['order_id' => …]` log lines in the instruction/consent/request-form
  jobs (wrong entity key) are gone — logs now use `class_basename` + per-entity context; `CollectRequest`
  lookup switched `first()` → `firstOrFail()` (missing row previously fataled on a null property access;
  still fails+retries, now with a real exception). Removed the 7 now-stale `nullsafe.neverNull` baseline
  entries for these files (**147 → 140**).
  GOTCHAS: the entity-update payload builds `updated_at` via `getAttribute('updated_at')` +
  `instanceof CarbonInterface` because the base sees only `Model` (direct `->updated_at` is
  `property.notFound` at lvl 6); the document relation is loaded in `document()` *before* `toArray()` so the
  `document` key stays in the entity payload exactly as before; `order_materials` fixtures need `server_id`
  (NOT NULL, no default).

### 32. Deduplicate Store/Update FormRequest `rules()` pairs (Low–Medium / Low)
Block-hash scan found 39 cross-file duplicate clusters; the biggest family is Store/Update FormRequest pairs
with near-identical `rules()`: `Laboratory/Requests/StoreTestRequest.php:28` vs `UpdateTestRequest.php:27`,
Store/UpdateOfferRequest, Store/UpdateRequestFormRequest, Consultation Store/UpdateConsultantRequest, and
more. A validation change can silently drift between create and update. Fix pattern: Update extends Store and
overrides only the differing rules, or a shared `rules()` helper/trait per entity. Mechanical; no behavior
change intended — cover with existing endpoint tests.
- [ ]

### 33. Queries inside loops on request paths (Low / Low)
Small-N but free wins:
- `Reception/Services/ReportService.php:445` — `syncSigners` runs `User::find($signerData['user_id'])` per
  signer; prefetch once with `whereIn('id', …)->get()->keyBy('id')` (also removes a Reception→User model
  touch from the loop).
- `Billing/Services/PaymentService.php:114` — `updatePayments` runs `findPaymentById` per row; prefetch the
  invoice's payments and look up in-memory. (`PaymentMethod::find` at :123 is the enum helper, not a query.)
Also fold in the trivial nit: 12 uses of `auth()->user()->id` → `auth()->id()`.
- [ ]

### 34. Baseline final tail — audit `nullsafe.neverNull` for lying types (Medium / Medium)
Baseline is down to **147** entries. Top identifiers: **37 `nullsafe.neverNull`** (code does `?->` on
something typed non-nullable — each is either a dead null-check or a *lying type*, and lying types hide real
NPE-class bugs — same "bugs hiding in the baseline" logic that made #7 pay off), 26 `argument.templateType`,
24 `missingType.parameter` (the deferred model-cascade tail — leave unless doing a coordinated pass, per #1's
GOTCHAs), 13 `property.notFound`, 11 `method.notFound` (re-audited in #1, false positives), and 1 baselined
`larastan.noEnvCallsOutsideOfConfig` (`ValidateEnvCommand` — legit by design, but worth an inline ignore with
reason instead of a baseline entry). Scope this item to the 37 `nullsafe.neverNull` + the singletons; use the
established `/tmp/sync_baseline.php` JSON method for removal.
- [ ]

### 35. Decide the `declare(strict_types=1)` policy (Medium / Medium–High)
CLAUDE.md mandates `declare(strict_types=1);`, but **811 of ~880** `app/` PHP files lack it (~8% adoption —
effectively aspirational). A blind mechanical pass is risky: strict types change scalar coercion at call
boundaries and can surface runtime `TypeError`s that only appear on real traffic. Decision needed:
(a) mechanical pass in domain slices with the full suite green per slice (mirrors the #8 batching method), or
(b) amend the rule to "new/touched files only" and add an enforcement guard for new files (cheap PHPUnit
code-quality test like `NoDebugFunctionsTest`, scoped to files created after a cutoff date/allowlist).
Recommendation: (b) first — it stops the bleeding for free; revisit (a) per-domain when test density (#9/#21)
is higher.
- [ ]

### 36. Frontend next tier — components, Filter clones, test density (Low / Medium)
After #27's top three, the next tier: `Pages/Acceptance/Components/Filter.jsx` 544,
`Pages/Section/Components/DoneForm.jsx` 495, `Pages/Acceptance/Components/AddTestOrPanel/PanelConfigStep.jsx`
495, `Pages/Report/Components/Signers.jsx` 492, `Pages/AcceptanceItem/Components/SectionsInfo/SampleTimeline.jsx`
484. Also structural: **33 files named `Filter.jsx`** (and 21 `AddForm.jsx`) — while decomposing, check for a
shared filter abstraction (field-config-driven `<FilterForm>`) instead of 33 hand-rolled variants. Frontend
test density is still thin (16 test files / 66 tests). Same rules as #5/#27: JS only, extract hooks +
subcomponents, eslint/prettier/vite build/vitest green.
- [ ]
