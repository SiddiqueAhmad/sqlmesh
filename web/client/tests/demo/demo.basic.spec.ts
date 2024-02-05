import { test } from '@playwright/test'
import {
  checkFile,
  selectEnvironment,
  selectFile,
  addEnvironment,
  goToPlan,
  applyPlan,
  goBackTo,
  checkModelChange,
  setFileContentAndSave,
} from './utils'
import {
  testHeader,
  testFooter,
  testModulesAPI,
  testMetaAPI,
  testEventsAPI,
  testFilesAPI,
  testEnvironmentsAPI,
  testModelsAPI,
  testPlanAPI,
  testHistoryNavigation,
  testEnvironmentDetails,
  testErrors,
  testModuleNavigation,
  testChangesAndBackfills,
  testEditor,
  testEditorTabs,
  testFileExplorer,
} from './help'

test('run basic demo', async ({ page }) => {
  test.setTimeout(120000)
  console.log('START')
  const apiModulesPromise = page.waitForResponse('/api/modules')
  const apiMetaPromise = page.waitForResponse('/api/meta')
  const apiEventsPromise = page.waitForResponse('/api/events')
  const apiFilesPromise = page.waitForResponse('/api/files')
  const apiEnvironmentsPromise = page.waitForResponse('/api/environments')
  const apiModelsPromise = page.waitForResponse('/api/models')
  const apiPlanPromise = page.waitForResponse('/api/plan')
  await page.goto('/')
  await testModulesAPI(
    page,
    { modules: ['docs', 'editor', 'errors', 'plans', 'files'] },
    apiModulesPromise,
  )
  await page.waitForURL('/editor')
  await testEventsAPI(page, apiEventsPromise)
  await testMetaAPI(page, apiMetaPromise)
  await testHeader(page)
  await testFooter(page)
  await testModelsAPI(page, apiModelsPromise)
  await testEnvironmentsAPI(page, apiEnvironmentsPromise)
  await testFilesAPI(page, { projectName: 'basic' }, apiFilesPromise)
  await testPlanAPI(page, apiPlanPromise)
  await testHistoryNavigation(page, { hasBack: true, hasForward: true })
  await testEnvironmentDetails(page, {
    env: 'prod',
    isDisabledAction: false,
    isDisabledEnv: true,
  })
  await testChangesAndBackfills(page, { added: 3, backfills: 3 })
  await testErrors(page, { label: 'No Errors' })
  await testModuleNavigation(page)
  await testEditor(page)
  await testEditorTabs(page)
  await testFileExplorer(page)
  await checkFile(page, { path: 'config.yaml' })
  console.log('Initial prod backfill')
  await goToPlan(page, { env: 'prod', action: 'Apply Changes And Backfill' })
  await applyPlan(page, { env: 'prod', action: 'Apply Changes And Backfill' })
  await goBackTo(page, { path: '/editor' })
  await testErrors(page, { label: 'No Errors' })
  await testChangesAndBackfills(page, { backfills: 0 })
  await testEnvironmentDetails(page, { env: 'prod' })
  console.log('Add dev')
  await addEnvironment(page, { env: 'dev' })
  console.log('Apply changes to dev')
  await testChangesAndBackfills(page, { backfills: 0 })
  await goToPlan(page, { env: 'dev', action: 'Apply Virtual Update' })
  await applyPlan(page, { env: 'dev', action: 'Apply Virtual Update' })
  await goBackTo(page, { path: '/editor' })
  await testErrors(page, { label: 'No Errors' })
  await testChangesAndBackfills(page, { backfills: 0 })
  await testEnvironmentDetails(page, { env: 'dev' })
  console.log('Change model')
  await selectFile(page, { path: 'models/incremental_model.sql' })
  await setFileContentAndSave(page, {
    path: 'models/incremental_model.sql',
    content: `
        MODEL (
          name sqlmesh_example.incremental_model,
          kind INCREMENTAL_BY_TIME_RANGE (
              time_column event_date
          ),
          start '2020-01-01',
          cron '@daily',
          grain (id, event_date)
      );
      
      SELECT
          id,
          item_id,
          event_date,
      FROM
          sqlmesh_example.seed_model
      WHERE
          event_date between @start_date and @end_date
      LIMIT 3
    `,
  })
  console.log('Apply changes to dev')
  await testChangesAndBackfills(page, { direct: 1, indirect: 1, backfills: 2 })
  await goToPlan(page, { env: 'dev', action: 'Apply Changes And Backfill' })
  await checkModelChange(page, {
    group: 'Modified Directly',
    model: 'sqlmesh_example__dev.incremental_model',
    change: 'Breaking Change',
  })
  await applyPlan(page, { env: 'dev', action: 'Apply Changes And Backfill' })
  await goBackTo(page, { path: '/editor' })
  await testErrors(page, { label: 'No Errors' })
  await testChangesAndBackfills(page, { backfills: 0 })
  await testEnvironmentDetails(page, { env: 'dev' })
  console.log('Select prod')
  await selectEnvironment(page, { env: 'prod' })
  await testEnvironmentDetails(page, { env: 'prod' })
  console.log('Apply virtual update to prod')
  await testChangesAndBackfills(page, { direct: 1, indirect: 1, backfills: 0 })
  await goToPlan(page, { env: 'prod', action: 'Apply Virtual Update' })
  await applyPlan(page, {
    env: 'prod',
    action: 'Apply Virtual Update',
    expectConfirmation: true,
  })
  await goBackTo(page, { path: '/editor' })
  await testErrors(page, { label: 'No Errors' })
  await testChangesAndBackfills(page, { backfills: 0 })
  console.log('Select dev')
  await selectEnvironment(page, { env: 'dev' })
  await testEnvironmentDetails(page, { env: 'dev' })
  await testChangesAndBackfills(page, { backfills: 0 })
  console.log('Change model')
  await setFileContentAndSave(page, {
    path: 'models/incremental_model.sql',
    content: `
      MODEL (
        name sqlmesh_example.incremental_model,
        kind INCREMENTAL_BY_TIME_RANGE (
            time_column event_date
        ),
        start '2020-01-01',
        cron '@daily',
        grain (id, event_date)
      );
      
      SELECT
          id,
          item_id,
          event_date,
      FROM
          sqlmesh_example.seed_model
      WHERE
          event_date between @start_date and @end_date
    `,
  })
  console.log('Apply changes to dev')
  await testChangesAndBackfills(page, { direct: 1, indirect: 1, backfills: 2 })
  await goToPlan(page, { env: 'dev', action: 'Apply Changes And Backfill' })
  await checkModelChange(page, {
    group: 'Modified Directly',
    model: 'sqlmesh_example__dev.incremental_model',
    change: 'Breaking Change',
  })
  await applyPlan(page, { env: 'dev', action: 'Apply Changes And Backfill' })
  await goBackTo(page, { path: '/editor' })
  await testErrors(page, { label: 'No Errors' })
  await testChangesAndBackfills(page, { backfills: 0 })
  await testEnvironmentDetails(page, { env: 'dev' })
  console.log('END')
})
