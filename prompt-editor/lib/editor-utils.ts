// /prompt-editor/lib/editor-utils.ts

import type * as MonacoNS from "monaco-editor";
import type {RefObject} from "react";
import {VARIABLE_REGEX} from "./variable-regex";

/** Удобный алиас для редактора */
export type IStandaloneCodeEditor = MonacoNS.editor.IStandaloneCodeEditor;

export interface VariableMeta {
    name: string;
    isDefined: boolean;
    description?: string;
}

/**
 * Подсветка плейсхолдеров {{var}} с помощью decorations.
 * Возвращает (или обновляет) коллекцию декораций.
 */
export function updateVariableDecorations(
    editor: IStandaloneCodeEditor | null,
    monaco: typeof import("monaco-editor") | null,
    variables: { name: string; isDefined: boolean; description?: string }[],
    prevDecorationsCollection?: MonacoNS.editor.IEditorDecorationsCollection,
): MonacoNS.editor.IEditorDecorationsCollection | null {
    if (!editor || !monaco) return prevDecorationsCollection || null;
    const model = editor.getModel();
    if (!model) return prevDecorationsCollection || null;

    const decos: MonacoNS.editor.IModelDeltaDecoration[] = [];
    
    // Используем Monaco Editor API для поиска совпадений - это правильный способ!
    const matches = model.findMatches(
        VARIABLE_REGEX.source, 
        true, // searchOnlyEditableRange
        true, // isRegex
        true, // matchCase
        null, // wordSeparators
        true// captureMatches
    );

    matches.forEach((match) => {
        // match.matches[1] теперь содержит чистое имя переменной благодаря captureMatches=true
        const varName = match.matches?.[1]?.trim();

        if (!varName) return; // Пропускаем, если имя не захватилось

        const found = variables.find((v) => v.name.toLowerCase() === varName.toLowerCase());

        let cls = "inline-variable-undefined";
        let hover = `Undefined variable: {{${varName}}}`;
        if (found) {
            if (found.isDefined) {
                cls = "inline-variable-defined";
                hover = found.description || `Defined variable: {{${varName}}}`;
            } else {
                cls = "inline-variable-undefined";
                hover = `Variable is detected in prompt but not defined in the list: {{${varName}}}`;
            }
        }

        decos.push({
            range: match.range,
            options: {
                // isWholeLine: false, // Убедимся, что не красим всю строку
                inlineClassName: cls,
                hoverMessage: { value: hover },
            },
        });
    });

    // Очищаем предыдущие декорации и устанавливаем новые
    if (prevDecorationsCollection) {
        prevDecorationsCollection.set(decos);
        return prevDecorationsCollection;
    }
    return editor.createDecorationsCollection(decos);
}

/**
 * Получение позиции в редакторе по клиентским координатам (для DnD-caret).
 */
export function getEditorPositionFromClient(
    editor: IStandaloneCodeEditor | null,
    clientX: number,
    clientY: number,
): { lineNumber: number; column: number } | null {
    if (!editor) return null;
    const target: any = (editor as any).getTargetAtClientPoint?.(clientX, clientY);
    return target?.position ?? null;
}

/**
 * Базовые опции Monaco для обоих редакторов.
 * ВАЖНО: padding поддерживает только top/bottom.
 */
export function getBaseEditorOptions({
                                         fontSize,
                                         showLineNumbers,
                                     }: {
    fontSize: number;
    showLineNumbers: boolean;
}): MonacoNS.editor.IStandaloneEditorConstructionOptions {
    return {
        fontSize,
        lineNumbers: (showLineNumbers ? "on" : "off") as MonacoNS.editor.LineNumbersType,
        minimap: {enabled: false},
        wordWrap: "on" as const,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        renderWhitespace: "selection" as const,
        guides: {indentation: true, bracketPairs: true},
        padding: {top: 20, bottom: 20}, // нет left/right у IEditorPaddingOptions
        cursorBlinking: "smooth" as const,
        cursorSmoothCaretAnimation: "on" as const,
        fontLigatures: true,
        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',Consolas,monospace",
        lineHeight: 1.6,
        letterSpacing: 0.5,
        renderLineHighlight: "gutter" as const,
        occurrencesHighlight: "singleFile" as const,
        selectionHighlight: false,
        bracketPairColorization: {enabled: true},
        automaticLayout: true,
    };
}

/**
 * Очистка drop-каретки (декорации), если она была установлена.
 */
export function clearDropCaret(
    editor: IStandaloneCodeEditor | null,
    dropDecoRef: RefObject<MonacoNS.editor.IEditorDecorationsCollection | null>
) {
    if (!editor || !dropDecoRef.current) return;
    dropDecoRef.current.clear();
}
