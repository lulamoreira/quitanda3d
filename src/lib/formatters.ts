import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata um valor numérico para o padrão de moeda brasileiro (R$ X.XXX,XX)
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  let amount = 0;
  if (typeof value === 'string') {
    amount = parseFloat(value);
  } else if (typeof value === 'number') {
    amount = value;
  }
  
  if (isNaN(amount)) amount = 0;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};


/**
 * Formata uma data para o padrão brasileiro
 */
export const formatDate = (date: string | Date | null | undefined, pattern: string = "dd 'de' MMM 'de' yyyy"): string => {
  if (!date) return "";
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, pattern, { locale: ptBR });
};

/**
 * Retorna classes CSS para animação de entrada com delay opcional
 */
export const getStaggerDelay = (index: number) => {
  return {
    animationDelay: `${index * 50}ms`,
  };
};
