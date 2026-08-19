import { describe, expect, it, vi } from 'vitest'
import {
  buildDownloadConsentCopy,
  buildInstallConsentCopy,
} from '../../src/update/consent-copy.js'
import { createUpdateConsentHandler } from '../../src/update/consent-handler.js'
import {
  createInitialUpdateState,
  reduceUpdateState,
  type UpdateState,
} from '../../src/update/state.js'

describe('update consent copy', () => {
  it('names the remote version in download and install prompts', () => {
    const download = buildDownloadConsentCopy('1.2.3')
    expect(download.title).toMatch(/update/i)
    expect(download.message.toLowerCase()).toContain('download')
    expect(download.detail).toContain('1.2.3')
    expect(download.buttons[0]).toBe('Yes')
    expect(download.buttons[1]).toBe('No')
    expect(download.defaultId).toBe(0)
    expect(download.cancelId).toBe(1)

    const install = buildInstallConsentCopy('1.2.3')
    expect(install.title).toMatch(/install/i)
    expect(install.message.toLowerCase()).toMatch(/restart|install/)
    expect(install.detail).toContain('1.2.3')
    expect(install.buttons).toEqual(['Yes', 'No'])
  })
})

describe('createUpdateConsentHandler', () => {
  function available(version: string): UpdateState {
    let state = createInitialUpdateState('1.0.0')
    state = reduceUpdateState(state, { type: 'update-available', version })
    return state
  }

  function downloaded(version: string): UpdateState {
    let state = createInitialUpdateState('1.0.0')
    state = reduceUpdateState(state, { type: 'downloaded', version })
    return state
  }

  it('downloads only after Yes on update-available', async () => {
    const downloadUpdate = vi.fn(async () => {})
    const requestInstallDownloadedUpdate = vi.fn()
    const askDownload = vi.fn(async () => true)
    const askInstall = vi.fn(async () => false)

    const handle = createUpdateConsentHandler({
      actions: { downloadUpdate, requestInstallDownloadedUpdate },
      dialogs: { askDownload, askInstall },
    })

    handle(available('1.0.1'))
    await flush()

    expect(askDownload).toHaveBeenCalledTimes(1)
    expect(askDownload).toHaveBeenCalledWith('1.0.1')
    expect(downloadUpdate).toHaveBeenCalledTimes(1)
    expect(askInstall).not.toHaveBeenCalled()
    expect(requestInstallDownloadedUpdate).not.toHaveBeenCalled()
  })

  it('does not download when the user declines', async () => {
    const downloadUpdate = vi.fn(async () => {})
    const handle = createUpdateConsentHandler({
      actions: {
        downloadUpdate,
        requestInstallDownloadedUpdate: vi.fn(),
      },
      dialogs: {
        askDownload: vi.fn(async () => false),
        askInstall: vi.fn(async () => true),
      },
    })

    handle(available('2.0.0'))
    // Re-entrancy with the same version must not open another dialog.
    handle(available('2.0.0'))
    await flush()

    expect(downloadUpdate).not.toHaveBeenCalled()
  })

  it('installs only after Yes on downloaded', async () => {
    const requestInstallDownloadedUpdate = vi.fn()
    const askInstall = vi.fn(async () => true)
    const handle = createUpdateConsentHandler({
      actions: {
        downloadUpdate: vi.fn(async () => {}),
        requestInstallDownloadedUpdate,
      },
      dialogs: {
        askDownload: vi.fn(async () => true),
        askInstall,
      },
    })

    handle(downloaded('1.0.1'))
    await flush()

    expect(askInstall).toHaveBeenCalledWith('1.0.1')
    expect(requestInstallDownloadedUpdate).toHaveBeenCalledTimes(1)
  })

  it('does not install when the user declines restart', async () => {
    const requestInstallDownloadedUpdate = vi.fn()
    const handle = createUpdateConsentHandler({
      actions: {
        downloadUpdate: vi.fn(async () => {}),
        requestInstallDownloadedUpdate,
      },
      dialogs: {
        askDownload: vi.fn(async () => true),
        askInstall: vi.fn(async () => false),
      },
    })

    handle(downloaded('1.0.1'))
    await flush()

    expect(requestInstallDownloadedUpdate).not.toHaveBeenCalled()
  })

  it('re-prompts download after a new check cycle', async () => {
    const askDownload = vi.fn(async () => false)
    const handle = createUpdateConsentHandler({
      actions: {
        downloadUpdate: vi.fn(async () => {}),
        requestInstallDownloadedUpdate: vi.fn(),
      },
      dialogs: {
        askDownload,
        askInstall: vi.fn(async () => false),
      },
    })

    handle(available('1.0.1'))
    await flush()
    handle(reduceUpdateState(createInitialUpdateState('1.0.0'), { type: 'check-started' }))
    handle(available('1.0.1'))
    await flush()

    expect(askDownload).toHaveBeenCalledTimes(2)
  })
})

/**
 * Drain the microtask queue so promise chains inside the handler settle.
 */
async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}
