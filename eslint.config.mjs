import { tanstackConfig } from '@tanstack/eslint-config'
import prettier from 'eslint-config-prettier'

export default [{ ignores: ['dist/**', 'node_modules/**'] }, ...tanstackConfig, prettier]
