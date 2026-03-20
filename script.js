(function () {
  "use strict";

  // Garante que o script rode apenas na pagina que possui o formulario do editor.
  const form = document.getElementById("cardEditorForm");
  if (!form) {
    return;
  }

  // Mapeamento centralizado dos campos para facilitar manutencao e leitura.
  const controls = {
    eventType: document.getElementById("eventType"),
    title: document.getElementById("titleInput"),
    message: document.getElementById("messageInput"),
    bgColor: document.getElementById("bgColorInput"),
    textColor: document.getElementById("textColorInput"),
    borderColor: document.getElementById("borderColorInput"),
    fontSize: document.getElementById("fontSizeInput"),
    fontSizeOutput: document.getElementById("fontSizeOutput"),
    imageUrl: document.getElementById("imageUrlInput"),
    imageFile: document.getElementById("imageFileInput"),
    badgeCount: document.getElementById("badgeCountInput"),
    badgeCountOutput: document.getElementById("badgeCountOutput"),
    badgeText: document.getElementById("badgeTextInput"),
    badgeColor: document.getElementById("badgeColorInput"),
    badgeSize: document.getElementById("badgeSizeInput")
  };

  // Referencias dos elementos visuais do cartao que serao atualizados em tempo real.
  const card = {
    root: document.getElementById("liveCard"),
    title: document.getElementById("cardTitle"),
    message: document.getElementById("cardMessage"),
    image: document.getElementById("cardImage"),
    badges: document.getElementById("cardBadges")
  };

  // Modelos prontos por tipo de cartao: economiza tempo e padroniza o resultado inicial.
  const eventTemplates = {
    "Aniversário": {
      title: "Feliz Aniversário",
      message: "Que seu dia seja cheio de alegria, saúde e bons momentos.",
      bgColor: "#ffd7a8",
      textColor: "#2f241f",
      borderColor: "#d09058",
      badgeColor: "#fff3cf",
      badgeText: "Parabéns"
    },
    "Natal": {
      title: "Feliz Natal",
      message: "Que o seu Natal seja iluminado por paz, carinho e união.",
      bgColor: "#d9f0df",
      textColor: "#243227",
      borderColor: "#7ea988",
      badgeColor: "#fff6de",
      badgeText: "Boas Festas"
    },
    "Páscoa": {
      title: "Feliz Páscoa",
      message: "Desejo uma Páscoa doce, de renovação e esperança.",
      bgColor: "#ffe7d7",
      textColor: "#3d2e27",
      borderColor: "#d3a382",
      badgeColor: "#fff4cf",
      badgeText: "Celebre"
    },
    "Formatura": {
      title: "Parabéns Pela Formatura",
      message: "Sua dedicação trouxe você até aqui. Muito sucesso na nova etapa!",
      bgColor: "#dce8ff",
      textColor: "#1f2a40",
      borderColor: "#88a5db",
      badgeColor: "#eef4ff",
      badgeText: "Conquista"
    },
    "Outra celebração": {
      title: "Felicidades",
      message: "Que este momento seja lembrado com carinho e alegria.",
      bgColor: "#f4e4ff",
      textColor: "#30243c",
      borderColor: "#b89dd1",
      badgeColor: "#f8f0ff",
      badgeText: "Celebre"
    }
  };

  // Armazena imagem escolhida por upload local (base64) quando nao houver URL informada.
  let uploadedImageDataUrl = "";

  // Evita textos vazios no preview, aplicando um fallback amigavel.
  function sanitizeText(text, fallback) {
    const value = (text || "").trim();
    return value.length > 0 ? value : fallback;
  }

  // Posicoes predefinidas para distribuir selos sem sobreposicao excessiva.
  function badgePositions(index) {
    const positions = [
      { top: "18%", right: "6%", transform: "rotate(9deg)" },
      { top: "46%", left: "5%", transform: "rotate(-7deg)" },
      { top: "49%", right: "6%", transform: "rotate(6deg)" },
      { bottom: "10%", left: "8%", transform: "rotate(-6deg)" },
      { bottom: "10%", right: "8%", transform: "rotate(6deg)" },
      { top: "22%", left: "8%", transform: "rotate(-8deg)" }
    ];

    return positions[index % positions.length];
  }

  // Aplica o conjunto de valores do tipo de cartao selecionado no formulario.
  function applyTemplate() {
    const selectedEvent = controls.eventType.value;
    const template = eventTemplates[selectedEvent] || eventTemplates["Outra celebração"];

    controls.title.value = template.title;
    controls.message.value = template.message;
    controls.bgColor.value = template.bgColor;
    controls.textColor.value = template.textColor;
    controls.borderColor.value = template.borderColor;
    controls.badgeColor.value = template.badgeColor;
    controls.badgeText.value = template.badgeText;
  }

  // Prioriza URL da imagem; se estiver vazia, usa a imagem enviada do dispositivo.
  function setImageSource() {
    const urlValue = controls.imageUrl.value.trim();
    const selectedSource = urlValue !== "" ? urlValue : uploadedImageDataUrl;

    if (selectedSource) {
      card.image.src = selectedSource;
      card.image.style.display = "block";
    } else {
      card.image.removeAttribute("src");
      card.image.style.display = "none";
    }
  }

  // Recria os selos conforme quantidade e estilo definidos nos controles.
  function updateBadges() {
    const count = Number.parseInt(controls.badgeCount.value, 10);
    const safeCount = Number.isFinite(count) ? Math.max(0, Math.min(6, count)) : 0;
    const badgeText = sanitizeText(controls.badgeText.value, "Celebre");
    const badgeColor = controls.badgeColor.value;
    const badgeSize = Number.parseInt(controls.badgeSize.value, 10);

    controls.badgeCountOutput.value = String(safeCount);
    // Desabilita controles de selos quando nao ha selos para evitar entradas inutilizadas.
    controls.badgeText.disabled = safeCount === 0;
    controls.badgeColor.disabled = safeCount === 0;
    controls.badgeSize.disabled = safeCount === 0;

    card.badges.innerHTML = "";

    for (let i = 0; i < safeCount; i += 1) {
      const badge = document.createElement("div");
      const pos = badgePositions(i);
      badge.className = "card-badge";
      badge.textContent = badgeText;
      badge.style.backgroundColor = badgeColor;
      badge.style.fontSize = `${Math.max(12, Math.min(20, badgeSize))}px`;

      // Aplica estilo e posicao individual para cada selo decorativo.
      Object.assign(badge.style, pos);
      card.badges.appendChild(badge);
    }
  }

  // Atualiza todos os aspectos do cartao (texto, cores, tamanho, imagem e selos).
  function updateCard() {
    const titleText = sanitizeText(controls.title.value, "Seu Cartão Especial");
    const messageText = sanitizeText(controls.message.value, "Escreva uma mensagem para celebrar este momento.");
    const fontSizeValue = Number.parseInt(controls.fontSize.value, 10);

    controls.fontSizeOutput.value = String(fontSizeValue);

    card.title.textContent = titleText;
    card.message.textContent = messageText;
    card.root.style.background = `linear-gradient(145deg, #fff8ef 0%, ${controls.bgColor.value} 100%)`;
    card.root.style.color = controls.textColor.value;
    card.root.style.borderColor = controls.borderColor.value;
    card.message.style.fontSize = `${Math.max(14, Math.min(28, fontSizeValue))}px`;

    setImageSource();
    updateBadges();
  }

  // Valida arquivo local de imagem por tipo e tamanho antes de renderizar no cartao.
  function onFileSelected() {
    const file = controls.imageFile.files && controls.imageFile.files[0];
    if (!file) {
      uploadedImageDataUrl = "";
      updateCard();
      return;
    }

    // Limite de 2MB e formatos comuns para reduzir erros e evitar arquivos pesados.
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
      controls.imageFile.value = "";
      uploadedImageDataUrl = "";
      updateCard();
      return;
    }

    // Leitura assíncrona para exibir preview imediato sem envio para servidor.
    const reader = new FileReader();
    reader.onload = function () {
      uploadedImageDataUrl = typeof reader.result === "string" ? reader.result : "";
      updateCard();
    };
    reader.readAsDataURL(file);
  }

  // Atualizacao ao vivo: qualquer mudanca no formulario reflete imediatamente no cartao.
  form.addEventListener("input", updateCard);
  controls.eventType.addEventListener("change", function () {
    applyTemplate();
    updateCard();
  });
  controls.imageFile.addEventListener("change", onFileSelected);

  // Inicializacao do editor com modelo padrao e preview pronto ao abrir a pagina.
  applyTemplate();
  updateCard();
})();
