document.addEventListener("DOMContentLoaded", () => {
    // Caminho para o arquivo CSV
    const filePath = "../src/js/athlete_events.csv";

    // Função para processar o arquivo CSV
    const processarCSV = () => {
        fetch(filePath) //Busca o arquivo no servidor e retorna uma Promise com a resposta
            .then(response => response.text())
            .then(csvLinha => {
                /*O conteúdo do arquivo é passado como argumento para a função
                Divide o CSV em linhas, utilizando o padrão de separação ";;;;;;;;;;;;;;\n?"
                Isso significa que o separador é uma linha que contém múltiplos ';' seguidos por uma possível quebra de linha (/n)
                O [cabecalho, ...linhas] é uma técnica chamada "destructuring assignment" que divide o resultado da divisão do CSV em duas partes
                - cabecalho: a primeira linha (que contém o cabeçalho)
                - linhas: as linhas restantes (dados)*/

                // Divide a string csvLinha em um array de linhas usando a quebra de linha como separador
                const [cabecalho, ...linhas] = csvLinha.split('\n');

                // Converte cada elemento do cabeçalho para letras minúsculas e remove as aspas duplas
                const cabecalhoFormatado = cabecalho
                    .toLowerCase() // Converte para minúsculas
                    .split(',') // Divide os dados usando a vírgula como parâmetro
                    .map((elemento) => elemento.replace(/["]/g, "")); // Remove aspas duplas de cada elemento do cabeçalho

                // Mapeia as linhas de dados para registros processados
                const registros = linhas.map(linha => {
                    // Verifica se a linha é null ou vazia
                    if (!linha) return;

                    // Extrai os campos da linha usando uma expressão regular
                    const campos = linha.match(/(?:[^,"]+|"[^"]*")+/g);

                    // Reduz os campos em um objeto de registro usando o cabeçalho formatado
                    return cabecalhoFormatado.reduce((objeto, campo, indice) => {
                        // Extrai o valor do campo e remove as aspas e barras invertidas
                        const valor = (typeof campos[indice] === 'string' ? campos[indice].replace(/^\\*"?|\\*"?$/g, '') : campos[indice]);

                        // Verifica se o campo deve ser convertido para número e cria um novo objeto de registro
                        const novoObjeto = Object.assign({}, objeto, {
                            [campo]: ['id', 'age', 'weight', 'year', 'height'].includes(campo) && !isNaN(parseFloat(valor)) ? parseInt(valor, 10) : valor
                        });
                        return novoObjeto;
                    }, {});
                });

                // Filtra apenas os registros de atletas do sexo feminino
                const atletasF = registros.filter((atleta) => atleta && atleta.sex === 'F'); // Exibe os registros de atletas femininas no console
                const mediaAlturaAtletas = (esporte) => (atletas) => {
                    const alturasUnicas = atletas
                        .filter(atleta => atleta.height !== 'NA' && atleta.sport === esporte) // Corrigindo 'Height' para 'height' e 'Sport' para 'sport'
                        .map(atleta => parseFloat(atleta.height)) // Convertendo altura para número
                    const alturaFormatada = alturasUnicas.map((altura) => (altura / 100)) // Removendo o toFixed() para manter o número decimal
                    const somaAlturas = alturaFormatada.reduce((acc, altura) => acc + altura, 0) // Removendo parseFloat() pois já estamos trabalhando com números
                    const qtdeAtletas = alturasUnicas.length
                    const mediaAlturas = (somaAlturas / qtdeAtletas).toFixed(2).replace('.', ',') // Mantendo a formatação da média
                
                    return `A média de altura das atletas da modalidade ${esporte} é ${mediaAlturas}m!`;
                }                        
                const selectElement5 = document.querySelector('select');

                selectElement5.addEventListener('change', () => {
                    const esporteSelecionado = selectElement5.value;
                    const resultadoMediaAltura = mediaAlturaAtletas(esporteSelecionado)(atletasF);

                    const mediaAlturaElement = document.getElementById('mediaAltura');

                    mediaAlturaElement.textContent = resultadoMediaAltura;
                });
                // Filtro de todos os países das atletlas femininas
                const paisesAtletasF = [...new Set(atletasF.map(atleta => atleta.city))];
                const calcularMedalhas = () => {
                    const paísSelecionado = document.getElementById('selectPais').value;
                    const esporteSelecionado = document.getElementById('selectModalidade').value;
                    if (paísSelecionado !== 'Selecione' && esporteSelecionado !== 'Selecione') {
                        const totalMedalhas = atletasF.reduce((total, atleta) => {
                            if (atleta.city === paísSelecionado && atleta.sport === esporteSelecionado && atleta.medal === 'Gold') {
                                total++;
                            }
                            return total;
                        }, 0);
                        document.getElementById('resultado2').innerText = `Total de medalhas de ouro: ${totalMedalhas}`;
                    } else {
                        document.getElementById('resultado2').innerText = "Por favor, selecione tanto o país quanto o esporte.";
                    }
                };

                const selectPaisElement = document.getElementById('selectPais');
                const selectModalidadeElement = document.getElementById('selectModalidade');

                selectPaisElement.addEventListener('change', calcularMedalhas);
                selectModalidadeElement.addEventListener('change', calcularMedalhas);
                selectPaisElement.dispatchEvent(new Event('change')); // Força o cálculo inicial

                // Função que identifica o país com mais ou menos medalhas em um esporte específico
                const medalhasPorEsporte = (esporte) => (atletas) => {
                    const medalhasPorPaís = atletas.filter(atleta => atleta.medal !== "NA" && atleta.sport === esporte)
                        .reduce((acumulador, atleta) => {
                            acumulador[atleta.team] = (acumulador[atleta.team] || 0) + 1;
                            return acumulador;
                        }, {});

                    const paísesOrdenados = Object.entries(medalhasPorPaís)
                        .sort(([, medalhasA], [, medalhasB]) => medalhasB - medalhasA);

                    if (paísesOrdenados.length === 0) {
                        const mensagemElement = document.getElementById('mensagem');
                        mensagemElement.textContent = `Não há países com medalhas para o esporte ${esporte}.`;
                        return;
                    }

                    const [paísMaisMedalhas, totalMedalhas] = paísesOrdenados[0];
                    const paisSemMedalhas = Object.entries(medalhasPorPaís).filter(([, medalhas]) => medalhas === 0);
                    const semMedalhas = paisSemMedalhas.map(([pais]) => ` ${pais}`);

                    const paísesOrdenadosDesc = paísesOrdenados.sort(([, medalhasA], [, medalhasB]) => medalhasB - medalhasA);
                    const paisComUmaMedalha = paísesOrdenadosDesc.filter(([, medalhas]) => medalhas === 1);
                    const menosMedalhas = paisComUmaMedalha.map(([pais]) => ` ${pais}`);

                    if (semMedalhas.length === 0) {
                        if (menosMedalhas.length === 0) {
                            return `\nO país com o maior número de medalhas femininas em ${esporte} é ${paísMaisMedalhas}, com o total de ${totalMedalhas} medalhas!` +
                                   `\n\nNão há países com apenas 1 medalha na modalidade feminina de ${esporte}`;
                        } else {
                            return `\nO país com o maior número de medalhas femininas em ${esporte} é ${paísMaisMedalhas}, com o total de ${totalMedalhas} medalhas!` +
                                   `\n\nOs seguintes países possuem apenas 1 medalha na modalidade feminina de ${esporte}:\n ${menosMedalhas}`;
                        }
                    } else if (semMedalhas.length > 0) {
                        if (menosMedalhas.length === 0) {
                            return `\nOs seguintes países não possuem nenhuma medalha na modalidade feminina de ${esporte}:\n ${semMedalhas}` +
                                   `\nO país com o maior número de medalhas femininas em ${esporte} é ${paísMaisMedalhas}, com o total de ${totalMedalhas} medalhas!` +
                                   `\n\nNão há países com apenas 1 medalha na modalidade feminina de ${esporte}`;
                        }
                            return `\nOs seguintes países não possuem nenhuma medalha na modalidade feminina de ${esporte}:\n ${semMedalhas}` +
                                    `\nO país com o maior número de medalhas femininas em ${esporte} é ${paísMaisMedalhas}, com o total de ${totalMedalhas} medalhas!` +
                                    `\n\nOs seguintes países possuem apenas 1 medalha na modalidade feminina de ${esporte}:\n ${menosMedalhas}`;
                    }
                };

                // Função que retorna o nome da atleta que possui mais medalhas em um esporte
                const atletaComMaisMedalhas = (esporte) => (atletas) => {
                    const atletasComMedalhasPorEdicao = atletas.reduce((acumulador, atleta) => {
                        if (atleta.medal !== "NA" && atleta.sport === esporte) {
                            const chave = atleta.name + atleta.edition;
                            acumulador[chave] = (acumulador[chave] || { nome: atleta.name, totalMedalhas: 0 });
                            acumulador[chave].totalMedalhas++;
                        }
                        return acumulador;
                    }, {});
                
                    const medalhasPorAtleta = Object.values(atletasComMedalhasPorEdicao);
                    if (medalhasPorAtleta.length === 0) {
                        return `Não há registros de medalhas para o esporte ${esporte}.`;
                    }
                
                    const maxMedalhas = Math.max(...medalhasPorAtleta.map(atleta => atleta.totalMedalhas));
                    const atletasMaxMedalhas = medalhasPorAtleta.filter(atleta => atleta.totalMedalhas === maxMedalhas);
                
                    if (atletasMaxMedalhas.length === 1) {
                        return `A atleta que conquistou mais medalhas na modalidade ${esporte} em toda história foi ${atletasMaxMedalhas[0].nome} com o total de ${maxMedalhas} medalhas conquistadas!`;
                    } else {
                        const nomesAtletas = atletasMaxMedalhas.map(atleta => atleta.nome).join(', ');
                        return `As atletas que conquistaram mais medalhas na modalidade ${esporte} em toda história foram ${nomesAtletas} com o total de ${maxMedalhas} medalhas conquistadas!`;
                    }
                }; // fecha a funçao atletaComMaisMedalhas
                
                // Função que retorna a atleta mais nova e a mais velha a competir em uma edição
                const idadeAtletas = (edicao) => (atletas) => {
                    const ano = parseInt(edicao)
                    const filtroPorEdicao = atletas.filter((atleta) => atleta.year === ano);
                    
                    const verao = filtroPorEdicao.filter((atleta) => atleta.season === 'Summer');
                    const inverno = filtroPorEdicao.filter((atleta) => atleta.season === 'Winter');
                
                    if (verao.length === 0 && inverno.length === 0) {
                        return `Não há atletas competindo na temporada Verão ou Inverno do ano ${ano}.`;
                    }
                
                    const maisVelhaVer = verao.length > 0 ? verao.reduce((a, b) => a.age > b.age ? a : b) : null;
                    const maisNovaVer = verao.length > 0 ? verao.reduce((a, b) => a.age < b.age ? a : b) : null;
                
                    const maisVelhaInv = inverno.length > 0 ? inverno.reduce((a, b) => a.age > b.age ? a : b) : null;
                    const maisNovaInv = inverno.length > 0 ? inverno.reduce((a, b) => a.age < b.age ? a : b) : null;
                
                    const veraoText = verao.length > 0 ? `A atleta mais velha a competir na temporada Verão do ano ${ano} foi ${maisVelhaVer.name} (${maisVelhaVer.team}), aos seus ${maisVelhaVer.age} anos de idade.\nA atleta mais nova a competir na mesma edição foi ${maisNovaVer.name} (${maisNovaVer.team}), aos seus ${maisNovaVer.age} anos de idade!` : '';
                    
                    const invernoText = inverno.length > 0 ? `A atleta mais velha a competir na temporada Inverno do ano ${ano} foi ${maisVelhaInv.name} (${maisVelhaInv.team}), aos seus ${maisVelhaInv.age} anos de idade.\nA atleta mais nova a competir na mesma edição foi ${maisNovaInv.name} (${maisNovaInv.team}), aos seus ${maisNovaInv.age} anos de idade!` : '';
                
                    return veraoText + '\n' + invernoText;
                };                 

                //Função auxiliar que retorna todas as edições do arquivo CSV
                const anos = (atletas) => {
                    const edições = atletas.map((atleta) => atleta.year)
                    const ediçõesSemRepetição = edições.filter((ano, indice) => edições.indexOf(ano) === indice)
                    return ediçõesSemRepetição.sort();
                }
                //Código que lê a opção selecionada pelo usuário no site e passa como parâmetro de entrada, chamando as funções
                const selectElement = document.querySelectorAll('select')[0];
                const selectElement2 = document.querySelectorAll('select')[1];
                const selectElement3 = document.querySelectorAll('select')[2];
                const selectElement4 = document.querySelectorAll('select')[3];

                selectElement.addEventListener('change', () => {
                    const esporteSelecionado = selectElement.value;
                    const resultadoMediaAltura = mediaAlturaAtletas(esporteSelecionado)(atletasF);
                    const mediaAlturaElement = document.getElementById('mediaAltura');
                    mediaAlturaElement.textContent = resultadoMediaAltura;
                });

                selectElement2.addEventListener('change', () => {
                    const esporteSelecionado = selectElement2.value;
                    const resultadoMedalhasPorEsporte = medalhasPorEsporte(esporteSelecionado)(atletasF);
                    const medalhasPorEsporteElement = document.getElementById('medalhasPorEsporte');
                    medalhasPorEsporteElement.textContent = resultadoMedalhasPorEsporte;
                });

                selectElement3.addEventListener('change', () => {
                    const esporteSelecionado = selectElement3.value;
                    const resultadoAtletaComMaisMedalhas = atletaComMaisMedalhas(esporteSelecionado)(atletasF);
                    const atletaComMaisMedalhasElement = document.getElementById('atletaComMaisMedalhas');
                    atletaComMaisMedalhasElement.textContent = resultadoAtletaComMaisMedalhas;
                });

                selectElement4.addEventListener('change', () => {
                    const edicaoSelecionada = selectElement4.value;
                    const resultadoIdadeAtletas = idadeAtletas(edicaoSelecionada)(atletasF);
                    const idadeAtletasElement = document.getElementById('idadeAtletas');
                    idadeAtletasElement.textContent = resultadoIdadeAtletas;
                });
                
            }) //chave que fecha o .then
            .catch(error => { // Chama o catch quando a promisse é rejeitada, e retorna um erro
                console.log('Ocorreu um erro ao processar o arquivo CSV: ', error);
            });
    };
    // Chama a função para processar o CSV quando o DOM estiver carregado
    processarCSV();
});



