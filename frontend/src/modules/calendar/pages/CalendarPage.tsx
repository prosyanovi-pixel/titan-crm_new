// frontend/src/modules/calendar/pages/CalendarPage.tsx
import React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { usePageSettings } from "@/context/LayoutContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  CalendarEvent as CalendarEventSheet,
  CalendarDayView,
  CalendarMonthView,
  CalendarYearView,
  CalendarViewSwitcher,
} from "@/modules/calendar";
import { useCalendarPage } from "../hooks/useCalendarPage";

export default function Calendar() {
  const { t } = useTranslation();
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    viewMode,
    setViewMode,
    isSheetOpen,
    setIsSheetOpen,
    selectedEvent,
    searchQuery,
    setSearchQuery,
    getDayEvents,
    handlePrev,
    handleNext,
    handleToday,
    handleDateClick,
    handleEventClick,
    handleSaveEvent,
    handleDeleteEvent,
    getEventColor,
    getEventIcon,
  } = useCalendarPage();

  usePageSettings({
    title: t("calendar.title"),
    breadcrumbs: [{ label: t("calendar.title") }],
    actions: (
      <div className="flex items-center gap-2">
        <div className="relative w-64 mr-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("calendar.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button size="sm" onClick={() => setIsSheetOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t("calendar.add_button")}
        </Button>
      </div>
    ),
  });

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold capitalize">
              {format(currentDate, "LLLL yyyy", { locale: ru })}
            </h2>
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="h-8 w-9 rounded-none border-r"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleToday}
                className="h-8 px-4 rounded-none font-normal text-sm"
              >
                {t("calendar.today_button")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-8 w-9 rounded-none border-l"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <CalendarViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        <div className="flex-1 bg-card rounded-xl border shadow-sm overflow-hidden min-h-[600px]">
          {viewMode === "day" && (
            <CalendarDayView
              currentDate={currentDate}
              getDayEvents={getDayEvents}
              onEventClick={handleEventClick}
              getEventColor={getEventColor}
              getEventIcon={getEventIcon}
            />
          )}
          {viewMode === "month" && (
            <CalendarMonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              getDayEvents={getDayEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              getEventColor={getEventColor}
              getEventIcon={getEventIcon}
            />
          )}
          {viewMode === "year" && (
            <CalendarYearView
              currentDate={currentDate}
              getDayEvents={getDayEvents}
              setCurrentDate={setCurrentDate}
              setViewMode={setViewMode}
            />
          )}
        </div>
      </div>

      <CalendarEventSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        initialDate={selectedDate || undefined}
        event={selectedEvent}
        initialContractorId={selectedEvent?.contractorId}
        initialAssignee={selectedEvent?.assignee}
        initialProjectId={selectedEvent?.projectId}
        onSave={handleSaveEvent}
        onDelete={(id) => handleDeleteEvent(String(id))}
      />
      {isSheetOpen && console.log('[CalendarPage] Rendering CalendarEventSheet with:', JSON.parse(JSON.stringify({ 
        selectedEvent, 
        initialContractorId: selectedEvent?.contractorId, 
        initialAssignee: selectedEvent?.assignee,
        initialProjectId: selectedEvent?.projectId 
      })))}
    </>
  );
}
