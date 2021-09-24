import path from 'path'
import fs from 'fs/promises'
import { bold } from 'chalk'
import glob from 'fast-glob'
import { Project, ScriptTarget } from 'ts-morph'
import { parallel } from 'gulp'
import { epRoot, buildOutput, projRoot } from './utils/paths'
import { yellow, green } from './utils/log'
import { buildConfig } from './info'
import { withTaskName } from './utils/gulp'
import { run } from './utils/process'
import type { Module } from './info'

import type { SourceFile } from 'ts-morph'

const TSCONFIG_PATH = path.resolve(projRoot, 'tsconfig.dts.json')

export const genEntryTypes = async () => {
  const files = await glob('*.ts', {
    cwd: epRoot,
    absolute: true,
  })
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      declaration: true,
      emitDeclarationOnly: true,
      noEmitOnError: false,
      outDir: path.resolve(buildOutput, 'entry/types'),
      skipLibCheck: true,
      esModuleInterop: true,
      target: ScriptTarget.ESNext,
      downlevelIteration: true,
      // types: ["./typings", "esnext", "dom"],
    },
    skipFileDependencyResolution: true,
    tsConfigFilePath: TSCONFIG_PATH,
    skipAddingFilesFromTsConfig: true,
  })
  const sourceFiles: SourceFile[] = []
  files.map((f) => {
    const sourceFile = project.addSourceFileAtPath(f)
    sourceFiles.push(sourceFile)
  })

  const tasks = sourceFiles.map(async (sourceFile) => {
    yellow(`Emitting file: ${bold(sourceFile.getFilePath())}`)
    await sourceFile.emit()
    const emitOutput = sourceFile.getEmitOutput()
    for (const outputFile of emitOutput.getOutputFiles()) {
      const filepath = outputFile.getFilePath()

      await fs.mkdir(path.dirname(filepath), {
        recursive: true,
      })
      await fs.writeFile(
        filepath,
        outputFile.getText().replaceAll('@element-plus', '.'),
        'utf8'
      )
      green(`Definition for file: ${bold(sourceFile.getBaseName())} generated`)
    }
  })

  await Promise.all(tasks)
}

export function copyEntryTypes() {
  const src = path.resolve(buildOutput, 'entry', 'types')
  const copy = (module: Module) =>
    withTaskName(`copyEntryTypes:${module}`, () =>
      run(`rsync -a ${src}/ ${buildConfig[module].output.path}/`)
    )

  return parallel(copy('esm'), copy('cjs'))
}
