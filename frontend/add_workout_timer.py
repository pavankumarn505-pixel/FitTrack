from pathlib import Path

path = Path("src/pages/Workouts.jsx")
source = path.read_text(encoding="utf-8")

def replace_once(old, new, description):
    global source
    count = source.count(old)
    if count != 1:
        raise SystemExit(
            f"STOP: Expected one match for {description}, found {count}"
        )
    source = source.replace(old, new, 1)

replace_once(
'''  X,
} from "lucide-react";''',
'''  X,
  Play,
  Square,
} from "lucide-react";''',
"lucide imports"
)

replace_once(
'''const initialForm = {
  workout_name: "",
  category: "Cardio",
  duration: "",
  calories_burned: "",
  workout_date: new Date().toISOString().split("T")[0],
};''',
'''const initialForm = {
  workout_name: "",
  category: "Cardio",
  duration: "",
  calories_burned: "",
  workout_date: new Date().toISOString().split("T")[0],
};

const CALORIES_PER_MINUTE = {
  Cardio: 8,
  Strength: 5,
  Yoga: 3,
};

const formatElapsedTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const getLocalDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};''',
"timer helper functions"
)

replace_once(
'''  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");''',
'''  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  // MODULE 16: WORKOUT TIMER
  const [timerWorkoutName, setTimerWorkoutName] = useState("");
  const [timerCategory, setTimerCategory] = useState("Cardio");
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerSaving, setTimerSaving] = useState(false);
  const [timerError, setTimerError] = useState("");
  const [timerMessage, setTimerMessage] = useState("");''',
"timer state"
)

replace_once(
'''  useEffect(() => {
    fetchWorkouts();
  }, []);''',
'''  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Update the timer using the actual start timestamp.
  useEffect(() => {
    if (!timerStartTime) return;

    const updateElapsedTime = () => {
      setElapsedSeconds(
        Math.floor((Date.now() - timerStartTime) / 1000)
      );
    };

    updateElapsedTime();

    const intervalId = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(intervalId);
  }, [timerStartTime]);''',
"timer interval"
)

replace_once(
'''  const handleChange = (e) => {''',
'''  const handleStartTimer = () => {
    if (timerWorkoutName.trim().length < 2) {
      setTimerError("Enter a workout name with at least 2 characters.");
      return;
    }

    setTimerError("");
    setTimerMessage("");
    setElapsedSeconds(0);
    setTimerStartTime(Date.now());
  };

  const handleStopTimer = async () => {
    if (!timerStartTime || timerSaving) return;

    const durationMinutes = Math.max(
      1,
      Math.ceil(elapsedSeconds / 60)
    );

    const caloriesBurned = Math.round(
      durationMinutes * CALORIES_PER_MINUTE[timerCategory]
    );

    const payload = {
      workout_name: timerWorkoutName.trim(),
      category: timerCategory,
      duration: durationMinutes,
      calories_burned: caloriesBurned,
      workout_date: getLocalDate(),
    };

    setTimerStartTime(null);
    setTimerSaving(true);
    setTimerError("");
    setTimerMessage("");

    try {
      await api.post("/workouts/", payload);

      setTimerMessage(
        `Workout saved successfully! ${durationMinutes} minute(s), approximately ${caloriesBurned} kcal.`
      );

      setTimerWorkoutName("");
      setTimerCategory("Cardio");
      setElapsedSeconds(0);

      await fetchWorkouts();
    } catch (err) {
      console.error("Unable to save timed workout:", err);

      setTimerError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "The timer stopped, but the workout could not be saved. Please add it manually."
      );
    } finally {
      setTimerSaving(false);
    }
  };

  const estimatedCalories = Math.round(
    (elapsedSeconds / 60) *
    CALORIES_PER_MINUTE[timerCategory]
  );

  const handleChange = (e) => {''',
"timer actions"
)

replace_once(
'''        <section className="workout-form-card">''',
'''        {/* MODULE 16: WORKOUT TIMER */}
        <section className="workout-timer-card">
          <div className="workout-section-title">
            <div>
              <p className="dashboard-eyebrow">MODULE 16</p>
              <h2>Workout Timer & Live Tracking</h2>
              <p>Track your workout duration and estimated calories live.</p>
            </div>
            <Clock size={32} />
          </div>

          {timerError && (
            <div className="message error-message">{timerError}</div>
          )}

          {timerMessage && (
            <div className="message success-message">{timerMessage}</div>
          )}

          <div className="workout-timer-controls">
            <div className="form-group">
              <label>Workout Name</label>
              <input
                value={timerWorkoutName}
                onChange={(e) => setTimerWorkoutName(e.target.value)}
                placeholder="e.g. Morning Running"
                minLength={2}
                maxLength={100}
                disabled={Boolean(timerStartTime) || timerSaving}
              />
            </div>

            <div className="form-group">
              <label>Workout Category</label>
              <select
                value={timerCategory}
                onChange={(e) => setTimerCategory(e.target.value)}
                disabled={Boolean(timerStartTime) || timerSaving}
              >
                <option value="Cardio">Cardio</option>
                <option value="Strength">Strength</option>
                <option value="Yoga">Yoga</option>
              </select>
            </div>
          </div>

          <div className="workout-timer-display">
            <span>ELAPSED TIME</span>
            <h2>{formatElapsedTime(elapsedSeconds)}</h2>
            <p>
              {timerStartTime ? "Workout in progress" : "Ready to start"}
            </p>
          </div>

          <div className="workout-timer-live-stats">
            <div>
              <Flame size={22} />
              <span>Estimated Calories</span>
              <strong>{estimatedCalories} kcal</strong>
            </div>

            <div>
              <Clock size={22} />
              <span>Elapsed Minutes</span>
              <strong>{Math.floor(elapsedSeconds / 60)} min</strong>
            </div>
          </div>

          <div className="workout-timer-actions">
            {!timerStartTime ? (
              <button
                type="button"
                className="timer-start-button"
                onClick={handleStartTimer}
                disabled={timerSaving}
              >
                <Play size={18} />
                Start Workout
              </button>
            ) : (
              <button
                type="button"
                className="timer-stop-button"
                onClick={handleStopTimer}
                disabled={timerSaving}
              >
                <Square size={18} />
                Stop & Save Workout
              </button>
            )}

            {timerSaving && <span>Saving workout...</span>}
          </div>

          <p className="workout-timer-note">
            Calorie values are estimates using category-based rates:
            Cardio 8, Strength 5, and Yoga 3 kcal per minute.
            Saved duration is rounded up to a whole minute.
          </p>
        </section>

        <section className="workout-form-card">''',
"timer interface"
)

path.write_text(source, encoding="utf-8")
print("SUCCESS: Workout timer added to Workouts.jsx")
