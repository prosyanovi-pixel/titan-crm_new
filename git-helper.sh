#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

show_menu() {
    clear
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${GREEN}   🔧 Git Helper Script${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${YELLOW}1)${NC} 📦 Коммит + пуш всех изменений"
    echo -e "${YELLOW}2)${NC} 🌿 Создать новую ветку"
    echo -e "${YELLOW}3)${NC} 🔄 Обновить текущую ветку (pull)"
    echo -e "${YELLOW}4)${NC} 📊 Показать статус"
    echo -e "${YELLOW}5)${NC} 📜 Показать историю (log)"
    echo -e "${YELLOW}6)${NC} 🗑️ Очистить старые ветки"
    echo -e "${YELLOW}7)${NC} 🚀 Быстрый коммит (с авто-сообщением)"
    echo -e "${YELLOW}8)${NC} 🌐 Открыть GitHub для создания PR"
    echo -e "${YELLOW}0)${NC} 🚪 Выход"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -n "Выберите действие: "
}

commit_and_push() {
    if [[ -z $(git status -s) ]]; then
        echo -e "${RED}❌ Нет изменений для коммита${NC}"
        return
    fi
    
    echo -e "${YELLOW}📊 Изменения:${NC}"
    git status -s
    
    echo -e "${YELLOW}📝 Сообщение коммита:${NC}"
    read msg
    
    if [[ -z "$msg" ]]; then
        msg="Update: $(date '+%Y-%m-%d %H:%M')"
    fi
    
    git add .
    git commit -m "$msg"
    git push
    echo -e "${GREEN}✅ Готово!${NC}"
}

quick_commit() {
    if [[ -z $(git status -s) ]]; then
        echo -e "${RED}❌ Нет изменений${NC}"
        return
    fi
    
    git add .
    git commit -m "Quick update: $(date '+%Y-%m-%d %H:%M')"
    git push
    echo -e "${GREEN}✅ Быстрый коммит выполнен${NC}"
}

create_branch() {
    echo -e "${YELLOW}📝 Имя новой ветки:${NC}"
    read branch
    
    if [[ -n "$branch" ]]; then
        git checkout -b "$branch"
        echo -e "${GREEN}✅ Ветка $branch создана${NC}"
        echo -e "${YELLOW}🌐 Создать PR? (y/n):${NC}"
        read answer
        if [[ "$answer" == "y" ]]; then
            git push -u origin "$branch"
            repo_url=$(git config --get remote.origin.url | sed 's/\.git$//' | sed 's/github.com:/https:\/\/github.com\//' | sed 's/ssh:\/\/git@//' | sed 's/git@//' | sed 's/:/\//')
            echo -e "${GREEN}🔗 Ссылка для PR:${NC}"
            echo "$repo_url/pull/new/$branch"
        fi
    fi
}

clean_branches() {
    echo -e "${YELLOW}🗑️  Удаляем смерженные ветки (кроме main)...${NC}"
    git branch --merged | grep -v "\*\|main\|master" | xargs -n 1 git branch -d
    echo -e "${GREEN}✅ Готово${NC}"
}

open_github() {
    repo_url=$(git config --get remote.origin.url | sed 's/\.git$//' | sed 's/github.com:/https:\/\/github.com\//' | sed 's/ssh:\/\/git@//' | sed 's/git@//' | sed 's/:/\//')
    current_branch=$(git branch --show-current)
    
    echo -e "${GREEN}🔗 Открываю: $repo_url/pull/new/$current_branch${NC}"
    
    # Открываем в браузере (для macOS)
    open "$repo_url/pull/new/$current_branch" 2>/dev/null || \
    # Для Linux
    xdg-open "$repo_url/pull/new/$current_branch" 2>/dev/null || \
    # Для Windows
    start "$repo_url/pull/new/$current_branch" 2>/dev/null || \
    echo -e "${YELLOW}Не удалось открыть браузер. Ссылка выше.${NC}"
}

# Основной цикл
while true; do
    show_menu
    read choice
    
    case $choice in
        1) commit_and_push ;;
        2) create_branch ;;
        3) git pull && echo -e "${GREEN}✅ Обновлено${NC}" ;;
        4) git status ;;
        5) git log --oneline -10 ;;
        6) clean_branches ;;
        7) quick_commit ;;
        8) open_github ;;
        0) echo -e "${GREEN}👋 До свидания!${NC}"; exit 0 ;;
        *) echo -e "${RED}❌ Неверный выбор${NC}" ;;
    esac
    
    echo -e "\n${YELLOW}Нажмите Enter для продолжения...${NC}"
    read
done