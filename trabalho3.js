(function () {
  "use strict";

  async function fetchJson(url, options) {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status} ao acessar ${url}`);
    }

    return response.json();
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function renderDefinitionList(container, entries) {
    container.innerHTML = "";

    entries.forEach(([term, description]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = description;
      container.append(dt, dd);
    });
  }

  function initTranslationForm() {
    const form = document.getElementById("translationForm");
    if (!form) {
      return;
    }

    const status = document.getElementById("translationStatus");
    const details = document.getElementById("translationDetails");
    const sourceText = document.getElementById("sourceText");
    const targetLang = document.getElementById("targetLang");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const text = sourceText.value.trim();
      const lang = targetLang.value;

      if (text.length < 3) {
        setText(status, "Digite uma frase com pelo menos 3 caracteres antes de enviar.");
        details.innerHTML = "";
        sourceText.focus();
        return;
      }

      setText(status, "Enviando dados para a API MyMemory...");
      details.innerHTML = "";

      try {
        const params = new URLSearchParams({
          q: text,
          langpair: `pt|${lang}`
        });
        const data = await fetchJson(`https://api.mymemory.translated.net/get?${params.toString()}`);
        const translatedText = data.responseData && data.responseData.translatedText;

        if (!translatedText) {
          throw new Error("A API respondeu, mas nao enviou uma traducao valida.");
        }

        setText(status, "Traducao recebida com sucesso.");
        renderDefinitionList(details, [
          ["Texto enviado", text],
          ["Idioma solicitado", targetLang.options[targetLang.selectedIndex].textContent],
          ["Traducao retornada", translatedText]
        ]);
      } catch (error) {
        setText(status, `Nao foi possivel concluir a traducao: ${error.message}`);
        details.innerHTML = "";
      }
    });
  }

  function createApiCard(title, description, entries) {
    const article = document.createElement("article");
    const heading = document.createElement("h3");
    const paragraph = document.createElement("p");
    const list = document.createElement("dl");

    article.className = "api-card";
    heading.textContent = title;
    paragraph.textContent = description;
    list.className = "response-list";

    renderDefinitionList(list, entries);
    article.append(heading, paragraph, list);
    return article;
  }

  async function initParallelApis() {
    const results = document.getElementById("parallelResults");
    const status = document.getElementById("parallelStatus");
    if (!results || !status) {
      return;
    }

    try {
      const [spaceNews, currency, holidays] = await Promise.all([
        fetchJson("https://api.spaceflightnewsapi.net/v4/articles/?limit=1"),
        fetchJson("https://economia.awesomeapi.com.br/json/last/USD-BRL"),
        fetchJson("https://brasilapi.com.br/api/feriados/v1/2026")
      ]);

      const article = spaceNews.results && spaceNews.results[0];
      const usdBrl = currency.USDBRL;
      const nextHoliday = holidays[0];

      if (!article || !usdBrl || !nextHoliday) {
        throw new Error("Uma das APIs respondeu sem os campos esperados.");
      }

      results.innerHTML = "";
      results.append(
        createApiCard("Noticia espacial", "API Spaceflight News: mostra a noticia espacial mais recente retornada pela consulta.", [
          ["Titulo", article.title],
          ["Fonte", article.news_site],
          ["Publicado em", new Date(article.published_at).toLocaleDateString("pt-BR")]
        ]),
        createApiCard("Cotacao do dolar", "API AwesomeAPI: informa a cotacao atual de USD para BRL.", [
          ["Compra", `R$ ${Number(usdBrl.bid).toFixed(2)}`],
          ["Maior valor", `R$ ${Number(usdBrl.high).toFixed(2)}`],
          ["Menor valor", `R$ ${Number(usdBrl.low).toFixed(2)}`]
        ]),
        createApiCard("Feriado nacional", "API BrasilAPI: mostra um feriado nacional retornado para o ano de 2026.", [
          ["Nome", nextHoliday.name],
          ["Data", new Date(`${nextHoliday.date}T00:00:00`).toLocaleDateString("pt-BR")],
          ["Tipo", nextHoliday.type]
        ])
      );

      setText(status, "As tres APIs responderam corretamente.");
    } catch (error) {
      results.innerHTML = "";
      setText(status, `Nao foi possivel carregar todas as APIs: ${error.message}`);
    }
  }

  initTranslationForm();
  initParallelApis();
})();
