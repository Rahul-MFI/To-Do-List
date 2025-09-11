import {
  Briefcase,
  CheckSquare,
  Filter,
  Star,
  ArrowUpDown,
  Plus,
  Target,
  Lightbulb,
} from "lucide-react";

const WelcomePage = ({onAction}) => {
  const features = [
    {
      icon: <Briefcase className="w-8 h-8 text-yellow-600" />,
      title: "Create Workspaces",
      description:
        "Organize your tasks by creating dedicated workspaces for different projects, teams, or areas of your life.",
      highlight: "Keep everything organized",
    },
    {
      icon: <Plus className="w-8 h-8 text-yellow-600" />,
      title: "Add Tasks",
      description:
        "Quickly create tasks with titles, descriptions, and due dates. Stay on top of everything you need to accomplish.",
      highlight: "Never forget a task",
    },
    {
      icon: <CheckSquare className="w-8 h-8 text-yellow-600" />,
      title: "Mark as Complete",
      description:
        "Track your progress by marking tasks as completed. Feel the satisfaction of checking items off your list.",
      highlight: "Celebrate progress",
    },
    {
      icon: <Star className="w-8 h-8 text-yellow-600" />,
      title: "Priority Levels",
      description:
        "Set priority levels (High, Medium, Low) to focus on what matters most and tackle important tasks first.",
      highlight: "Focus on what matters",
    },
    {
      icon: <Filter className="w-8 h-8 text-yellow-600" />,
      title: "Smart Filtering",
      description:
        "Filter tasks by completion status, priority level, or due date to view exactly what you need to see.",
      highlight: "Find tasks instantly",
    },
    {
      icon: <ArrowUpDown className="w-8 h-8 text-yellow-600" />,
      title: "Flexible Sorting",
      description:
        "Sort your tasks by due date, priority, creation date, or alphabetically to organize your workflow.",
      highlight: "Work your way",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      {/* Hero Section */}
      <div className="text-center py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-4xl xl:text-5xl font-bold text-gray-800 mb-6">
            Welcome to{" "}
            <span className="text-yellow-600 bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text">
              TaskSphere
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl xl:text-2xl text-gray-600 mb-8 mx-auto leading-relaxed">
            Your powerful productivity companion for organizing tasks, managing
            projects, and achieving your goals with ease.
          </p>

          {/* CTA Button */}
          <button
            onClick={()=> {onAction(true)}}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200 hover:shadow-xl"
          >
            <Plus className="w-6 h-6 inline-block mr-2" />
            Create Your First Workspace
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Powerful Features at Your Fingertips
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover how TaskSphere makes task management simple, efficient, and
            enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-yellow-100"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6 mx-auto">
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
                {feature.title}
              </h3>

              <p className="text-gray-600 text-center mb-4 leading-relaxed">
                {feature.description}
              </p>

              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <span className="text-yellow-700 font-semibold text-sm">
                  {feature.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-yellow-600 text-white py-5 text-center">
        <p className="text-lg font-medium">
          🎯 Transform your productivity with TaskSphere
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
