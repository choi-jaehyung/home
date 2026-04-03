import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CrossPokerGame from "@/components/CrossPokerGame";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "crossPoker" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function CrossPokerPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "crossPoker" });

  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    difficulty: t("difficulty"),
    easy: t("easy"),
    medium: t("medium"),
    hard: t("hard"),
    new_game: t("new_game"),
    check: t("check"),
    hint: t("hint"),
    undo: t("undo"),
    reveal_all: t("reveal_all"),
    correct: t("correct"),
    incorrect: t("incorrect"),
    correct_message: t("correct_message"),
    incorrect_message: t("incorrect_message"),
    select_suit: t("select_suit"),
    select_value: t("select_value"),
    card_tracker: t("card_tracker"),
    how_to_play: t("how_to_play"),
    rules_text: t("rules_text"),
    time: t("time"),
    difficulty_select: t("difficulty_select"),
    start_game: t("start_game"),
    hidden_cards: t("hidden_cards"),
    legend_revealed: t("legend_revealed"),
    legend_entered: t("legend_entered"),
    legend_duplicate: t("legend_duplicate"),
    legend_not_used: t("legend_not_used"),
  };

  return <CrossPokerGame translations={translations} />;
}
