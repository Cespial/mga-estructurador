import { describe, it, expect } from "vitest";
import { parseChatActions, stripChatActions } from "../chat-actions-parser";

describe("parseChatActions", () => {
  it("extracts a single FIELD_UPDATE directive", () => {
    const text =
      'Aqui va la explicacion.\n[FIELD_UPDATE field_id="objetivo_general" value="Mejorar la infraestructura vial"]';
    const actions = parseChatActions(text);
    expect(actions).toEqual([
      {
        field_id: "objetivo_general",
        value: "Mejorar la infraestructura vial",
      },
    ]);
  });

  it("extracts multiple FIELD_UPDATE directives", () => {
    const text = `Listo, actualizo los campos.
[FIELD_UPDATE field_id="titulo" value="Proyecto vial"]
[FIELD_UPDATE field_id="descripcion" value="Construccion de vias"]`;
    const actions = parseChatActions(text);
    expect(actions).toHaveLength(2);
    expect(actions[0].field_id).toBe("titulo");
    expect(actions[1].field_id).toBe("descripcion");
  });

  it("returns empty array when no directives present", () => {
    const text = "Esto es un texto normal sin directivas.";
    expect(parseChatActions(text)).toEqual([]);
  });

  it("handles empty value", () => {
    const text = '[FIELD_UPDATE field_id="campo" value=""]';
    const actions = parseChatActions(text);
    expect(actions).toEqual([{ field_id: "campo", value: "" }]);
  });
});

describe("stripChatActions", () => {
  it("removes FIELD_UPDATE directives and cleans up whitespace", () => {
    const text =
      'Aqui la explicacion.\n[FIELD_UPDATE field_id="f1" value="v1"]\n\nTexto extra.';
    const clean = stripChatActions(text);
    expect(clean).toBe("Aqui la explicacion.\n\nTexto extra.");
  });

  it("returns original text when no directives", () => {
    const text = "Sin directivas aqui.";
    expect(stripChatActions(text)).toBe("Sin directivas aqui.");
  });

  it("collapses triple+ newlines to double newlines", () => {
    const text =
      'Antes.\n\n\n[FIELD_UPDATE field_id="x" value="y"]\n\n\nDespues.';
    const clean = stripChatActions(text);
    expect(clean).not.toContain("\n\n\n");
  });
});
