import { expect, type Page } from '@playwright/test'

const NOT_EXIST = 'NOT_EXIST'
const EMPTY_STRING = ''
const PATH_SEPARATOR = process.env.UI_TEST_BROWSER === 'webkit' ? '/' : '\\'

export async function setFileContentAndSave(
  page: Page,
  opt: {
    path: string
    content: string
  },
): Promise<void> {
  const [path, fileName] = getFileNameAndParentFolder(opt.path)
  expect(path).toBeTruthy()
  expect(fileName).toBeTruthy()
  console.log(`Set new content for ${fileName} and save`)
  const elEditor = page.getByTestId('editor')
  await expect(elEditor).toBeVisible()
  const elCodeEditor = elEditor.getByTestId('code-editor')
  await expect(elCodeEditor).toBeVisible()
  const elEditorFooter = elEditor.getByTestId('editor-footer')
  await expect(elEditorFooter).toBeVisible()
  const elEditorTabs = elEditor.getByTestId('editor-tabs')
  await expect(elEditorTabs).toBeVisible()
  const elTab = elEditorTabs.getByTitle(path)
  await expect(elTab).toBeVisible()
  await expect(elTab.getByTitle('saved', { exact: true })).toBeVisible()
  await expect(
    elEditorFooter.getByTitle('saved', { exact: true }),
  ).toBeVisible()
  const elEditorTextbox = elCodeEditor.getByRole('textbox')
  await elEditorTextbox.fill(opt.content)
  await expect(elTab.getByTitle('unsaved', { exact: true })).toBeVisible()
  await expect(
    elEditorFooter.getByTitle('unsaved', { exact: true }),
  ).toBeVisible()
  const apiFilePromise = page.waitForResponse(`/api/files/${opt.path}`)
  const apiPlanPromise = page.waitForResponse('/api/plan')
  await elEditorTextbox.press('Control+S')
  const apiFile = await apiFilePromise
  expect(apiFile.status()).toBe(204)
  const apiPlan = await apiPlanPromise
  expect(apiPlan.status()).toBe(204)
  await expect(elTab.getByTitle('saved', { exact: true })).toBeVisible()
  await expect(
    elEditorFooter.getByTitle('saved', { exact: true }),
  ).toBeVisible()
}

export async function checkModelChange(
  page: Page,
  opt: {
    group: string
    model: string
    change: string
  },
): Promise<void> {
  const elPlanStageTracker = page.getByTestId('plan-stage-tracker')
  await expect(elPlanStageTracker).toBeVisible()
  const elGroup = elPlanStageTracker.getByTitle(opt.group)
  await expect(elGroup).toBeVisible()
  const elModel = elGroup.getByText(opt.model)
  await expect(elModel).toBeVisible()
  const elChange = elGroup.getByText(opt.change)
  await expect(elChange).toBeVisible()
}

export async function applyPlan(
  page: Page,
  opt: {
    env: string
    action: string
    expectConfirmation?: boolean
  },
): Promise<void> {
  const elPlan = page.getByTestId('plan')
  await expect(elPlan).toBeVisible()
  await expect(elPlan.getByRole('button', { name: opt.action })).toBeVisible()
  await expect(elPlan.getByRole('button', { name: 'Start Over' })).toBeVisible()
  await expect(elPlan.getByRole('button', { name: 'Cancel' })).toBeHidden()
  await elPlan.getByRole('button', { name: opt.action }).click()
  if (opt.expectConfirmation === true) {
    const elModelConfirmation = page.getByTestId('modal-confirmation')
    await expect(elModelConfirmation).toBeVisible()
    await expect(
      elModelConfirmation.getByRole('button', {
        name: `Yes, Run ${opt.env}`,
      }),
    ).toBeVisible()
    await elModelConfirmation
      .getByRole('button', { name: `Yes, Run ${opt.env}` })
      .click()
  }
  await expect(elPlan.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await expect(elPlan.getByRole('button', { name: opt.action })).toBeHidden()
  await expect(elPlan.getByRole('button', { name: 'Start Over' })).toBeHidden()
  await expect(elPlan.getByRole('button', { name: 'Go Back' })).toBeVisible()
  await expect(elPlan.getByRole('button', { name: 'Cancel' })).toBeHidden({
    timeout: 60000,
  })
}

export async function goBackTo(
  page: Page,
  otp: { path: string },
): Promise<void> {
  await page.getByTitle('Go Back', { exact: true }).click()
  await page.waitForURL(otp.path)
}

export async function goToPlan(
  page: Page,
  opt: { env: string; action: string },
): Promise<void> {
  const elEnvDetails = page.getByTestId('environment-details')
  const elAction = elEnvDetails.getByRole('link', { name: 'Plan' })
  await expect(elAction).toBeVisible()
  await elAction.click()
  await page.waitForURL(`/plan/environments/${opt.env}`)
  const elPlan = page.getByTestId('plan')
  await expect(elPlan).toBeVisible()
  await expect(elPlan.getByRole('button', { name: opt.action })).toBeVisible()
  await expect(elPlan.getByRole('button', { name: 'Start Over' })).toBeVisible()
  await expect(elPlan.getByRole('button', { name: 'Cancel' })).toBeHidden()
}

export async function addEnvironment(
  page: Page,
  opt: { env: string },
): Promise<void> {
  const elPageNavigation = page.getByTestId('page-navigation')
  const elEnvDetails = elPageNavigation.getByTestId('environment-details')
  const elSelectEnv = elEnvDetails.getByTestId('select-environment')
  await expect(elSelectEnv).toBeVisible()
  const elSelectEnvButton = elEnvDetails.getByRole('button', {
    name: `Environment:`,
  })
  await elSelectEnvButton.click()
  const elSelectEnvList = elEnvDetails.getByTestId('select-environment-list')
  const elAddEnv = elSelectEnvList.getByTestId('add-environment')
  await expect(elAddEnv).toBeVisible()
  const elAddEnvTextbox = elAddEnv.getByRole('textbox')
  await elAddEnvTextbox.fill(opt.env)
  const elAddEnvButton = elAddEnv.getByRole('button', { name: 'Add' })
  await expect(elAddEnvButton).toBeVisible()
  await elAddEnvButton.click()
  const elSelectDevEnv = elEnvDetails.getByRole('button', {
    name: `Environment:${opt.env}`,
  })
  await expect(elSelectDevEnv).toBeVisible()
}

export async function selectEnvironment(
  page: Page,
  opt: { env: string },
): Promise<void> {
  const elPageNavigation = page.getByTestId('page-navigation')
  const elEnvDetails = elPageNavigation.getByTestId('environment-details')
  const elSelectEnv = elEnvDetails.getByTestId('select-environment')
  await expect(elSelectEnv).toBeVisible()
  const elSelectEnvButton = elSelectEnv.getByRole('button')
  await elSelectEnvButton.click()
  const elSelectEnvList = elSelectEnv.getByTestId('select-environment-list')
  const elSelectEnvItem = elSelectEnvList.getByText(opt.env, { exact: true })
  await expect(elSelectEnvItem).toBeVisible()
  await elSelectEnvItem.click()
  await expect(elSelectEnvItem).toBeDisabled()
  await expect(
    elSelectEnv.getByRole('button', { name: `Environment:${opt.env}` }),
  ).toBeVisible()
  await expect(
    elSelectEnv.getByRole('button', { name: `Environment:${opt.env}` }),
  ).toBeEnabled()
}

export async function openFolders(
  page: Page,
  opt: { folders: string[] },
): Promise<void> {
  const elFE = page.getByTestId('file-explorer')
  await expect(elFE).toBeVisible()
  let folderName = EMPTY_STRING
  for (let i = 0; i < opt.folders.length; i++) {
    const folder = opt.folders[i] ?? NOT_EXIST

    folderName =
      folderName === EMPTY_STRING
        ? folder
        : `${folderName}${PATH_SEPARATOR}${folder}`
    console.log(`Open folder ${folderName}`)
    const elFolder = elFE.getByTitle(folderName, { exact: true })
    await expect(elFolder).toBeVisible()
    await elFolder.click()
  }
}

export async function checkFile(
  page: Page,
  opt: { path: string },
): Promise<void> {
  const path = opt.path.replaceAll('/', PATH_SEPARATOR)
  const folders = path.split(PATH_SEPARATOR)
  const fileName = folders.pop() ?? NOT_EXIST
  const parentFolderPath =
    folders.length > 0 ? folders.join(PATH_SEPARATOR) : fileName
  console.log(
    `Check file ${fileName} located at ${
      parentFolderPath === fileName ? 'root' : parentFolderPath
    }`,
  )
  await openFolders(page, { folders })
  const elFE = page.getByTestId('file-explorer')
  await expect(elFE).toBeVisible()
  await expect(elFE.getByTitle(fileName, { exact: true })).toBeVisible()
}

export async function selectFile(
  page: Page,
  opt: { path: string; modelName?: string },
): Promise<void> {
  const path = opt.path.replaceAll('/', PATH_SEPARATOR)
  const folders = path.split(PATH_SEPARATOR)
  const fileName = folders.pop() ?? NOT_EXIST
  const parentFolderPath =
    folders.length > 0 ? folders.join(PATH_SEPARATOR) : fileName
  const url = `/api/files/${opt.path}`
  console.log(
    `Select file ${fileName} located at ${
      parentFolderPath === fileName ? 'root' : parentFolderPath
    }`,
  )
  await openFolders(page, { folders })
  const apiFilePromise = page.waitForResponse(url)
  const elEditor = page.getByTestId('editor')
  await expect(elEditor).toBeVisible()
  const elCodeEditor = elEditor.getByTestId('code-editor')
  await expect(elCodeEditor).toBeVisible()
  const elEditorTabs = page.getByTestId('editor-tabs')
  await expect(elEditorTabs).toBeVisible()
  await expect(elEditorTabs.getByTitle(path)).toBeHidden()
  const elFE = page.getByTestId('file-explorer')
  await expect(elFE).toBeVisible()
  const elFile = elFE.getByTitle(path, { exact: true })
  await expect(elFile).toBeVisible()
  console.log(`Selecting ${fileName}`)
  await elFile.click()
  const apiFile = await apiFilePromise
  expect(apiFile.status()).toBe(200)
  const apiFileBody = await apiFile.json()
  expect(apiFileBody.path).toEqual(opt.path)
  expect(apiFileBody.name).toEqual(fileName)
  const contentFromText = (await elCodeEditor.getByRole('textbox').innerText())
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean)
  const contentFromApi = apiFileBody.content
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean)
  expect(contentFromText).toEqual(contentFromApi)
  await expect(elEditorTabs.getByTitle(path)).toBeVisible()
  if (opt.modelName != null) {
    await expect(elCodeEditor.getByText(opt.modelName)).toBeVisible()
  }
}

function getFileNameAndParentFolder(
  path: string,
): [string, Optional<string>, Optional<string>] {
  path = path.replaceAll('/', PATH_SEPARATOR)

  const folders = path.split(PATH_SEPARATOR)
  const fileName = folders.pop() ?? undefined
  const parentFolderPath =
    folders.length > 0 ? folders.join(PATH_SEPARATOR) : fileName

  return [path, fileName, parentFolderPath]
}
