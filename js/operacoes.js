(function (global) {
  window.Operacoes = {
    '+': {
      nome: 'soma',
      calcular({ amount, valor }) {
        console.log('Calculando soma:', { amount, valor });
        amount = parseFloat(amount);
        valor = parseFloat(valor);
        if (isNaN(amount) || isNaN(valor)) return 0;
        return {
          ok: true,
          substitue: true,
          resultado: amount + valor,
          mensagem: 'Soma realizada com sucesso',
        };
      }
    },
    '-': {
      nome: 'subtração',
      calcular({ amount, valor }) {
        amount = parseFloat(amount);
        valor = parseFloat(valor);
        if (isNaN(amount) || isNaN(valor)) return { ok: false, mensagem: 'Valores inválidos para subtração' };
        return {
          ok: true,
          substitue: true,
          resultado: amount - valor,
          mensagem: 'Subtração realizada com sucesso',
        };
      }
    },
    '*': {
      nome: 'multiplicação',
      calcular({ amount, valor }) {
        amount = parseFloat(amount);
        valor = parseFloat(valor);
        if (isNaN(amount) || isNaN(valor)) return { ok: false, mensagem: 'Valores inválidos para multiplicação' };
        return {
          ok: true,
          substitue: true,
          resultado: amount * valor,
          mensagem: 'Multiplicação realizada com sucesso',
        };
      }
    },
    '/': {
      nome: 'divisão',
      calcular({ amount, valor }) {
        amount = parseFloat(amount);
        valor = parseFloat(valor);
        if (isNaN(amount) || isNaN(valor) || valor === 0) return { ok: false, mensagem: 'Valores inválidos para divisão' };
        return {
          ok: true,
          substitue: true,
          resultado: amount / valor,
          mensagem: 'Divisão realizada com sucesso',
        };
      }
    },
    '%': {
      nome: 'porcentagem',
      calcular({ amount, valor }) {
        amount = parseFloat(amount);
        valor = parseFloat(valor);
        if (isNaN(amount) || isNaN(valor)) return { ok: false, mensagem: 'Valores inválidos para porcentagem' };
        if ((valor > 0 && valor <= 100) && amount > 0) {
          return {
            ok: true,
            substitue: false,
            resultado: (amount * valor) / 100,
            mensagem: 'Porcentagem realizada com sucesso',
          };
        }
        return { ok: false, mensagem: 'Valores inválidos para porcentagem' };
      }
    },
    'dia': {
      nome: 'dia da semana',
      data_set: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Feriado '],
      calcular({ amount, valor, data = new Date(), data_alvo }) {
        if (!data || !data_alvo) return { ok: false, mensagem: 'Data ou data alvo inválida' };
        const dataObj = new Date(data);
        const dataAlvoObj = new Date(data_alvo);
        if (isNaN(dataObj.getTime()) || isNaN(dataAlvoObj.getTime())) return { ok: false, mensagem: 'Data ou data alvo inválida' };
        diaSemana = dataObj.getDay();
        diaAlvoSemana = dataAlvoObj.getDay();
        if (diaSemana === diaAlvoSemana) {
          return {
            ok: true,
            substitue: false,
            resultado: window.Operacoes['%'].calcular({ amount: amount, valor: valor }),
            mensagem: `O dia da semana é ${window.Operacoes['dia'].data_set[diaSemana]}`,
          };
        }
        return { ok: false, mensagem: 'Dias da semana diferentes' };
      }
    },
    'feriado': {
      nome: 'feriado',
      calcular({ amount, valor, data = new Date(), feriados = [], operador }) {
        if (!data || !feriados || !Array.isArray(feriados)) return { ok: false, mensagem: 'Data ou feriados inválidos' };
        const dataObj = new Date(data);
        if (isNaN(dataObj.getTime())) return { ok: false, mensagem: 'Data inválida' };
        const diaSemana = dataObj.getDay();
        const isFeriado = feriados.some(feriado => {
          const feriadoDate = new Date(feriado);
          return feriadoDate.getDate() === dataObj.getDate() && feriadoDate.getMonth() === dataObj.getMonth();
        });
        if (isFeriado) {
          return {
            ok: true,
            resultado: window.Operacoes[operador].calcular({ amount: amount, valor: valor }),
            mensagem: `O dia é um feriado`,
          };
        }
        return { ok: false, mensagem: 'O dia não é um feriado' };

      }
    },
  }
  global.Operacoes = Operacoes;
})(window);
