// prompt-editor/lib/variable-regex.ts

/**
 * Каноническое регулярное выражение для поиска переменных.
 * Ищет строго {{variable}}.
 * - Поддерживает Unicode-символы в именах (\p{L}, \p{N}).
 * - Имя должно начинаться с буквы или '_'.
 * - Допускает пробелы внутри скобок.
 * - Флаги: g (global, все совпадения), u (unicode).
 */
export const VARIABLE_REGEX = /\{\{\s*([\p{L}_][\p{L}\p{N}_]*)\s*\}\}/gu;

/**
 * Находит все уникальные имена переменных в данном тексте.
 * @param text Текст для поиска.
 * @returns Массив уникальных имен переменных.
 */
export function findVariablesInText(text: string): string[] {
    const matches = new Set<string>();
    let match;

    // Важно сбрасывать lastIndex для глобального RegExp перед повторным использованием
    VARIABLE_REGEX.lastIndex = 0;

    while ((match = VARIABLE_REGEX.exec(text)) !== null) {
        // match[1] содержит захваченную группу (имя переменной)
        if (match[1]) {
            matches.add(match[1].trim().toLowerCase()); // Приводим к нижнему регистру для нечувствительности
        }
    }
    return Array.from(matches);
}