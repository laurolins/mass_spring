#include <memory>
#include <vector>
#include <iostream>
#include <fstream>
#include <cmath>
#include <iterator>
#include <regex>

#include "tclap/CmdLine.h"


//------------------------------------------------------------------------------
// Options
//------------------------------------------------------------------------------

struct Options {
public:
    Options(std::vector<std::string>& args);

public:
    TCLAP::CmdLine cmd_line { "Casts", ' ', "0.1" };

    // -i or --input
    TCLAP::ValueArg<std::string> input { "i", "input", "Input GEM (Graph Encoded Manifold)", false, "", "input" };
};

Options::Options(std::vector<std::string>& args) 
{
    cmd_line.add(input); // add command option
    cmd_line.parse(args);
}

//------------------------------------------------------------------------------
// Vec3 
//------------------------------------------------------------------------------

struct Vec3 {
    Vec3() = default;
    Vec3(double x, double y, double z=0.0);

    double length() const;

    Vec3& normalize();

        
    double x { 0.0 };
    double y { 0.0 };
    double z { 0.0 };
};

Vec3 operator+(const Vec3& a, const Vec3& b) {
    return {a.x + b.x, a.y + b.y, a.z + b.z};
}

Vec3 operator-(const Vec3& a, const Vec3& b) {
    return {a.x - b.x, a.y - b.y, a.z - b.z};
}

Vec3 operator*(const Vec3& a, double s) {
    return {a.x * s, a.y * s, a.z * s};
}

Vec3 operator*(double s, const Vec3& a) {
    return {a.x * s, a.y * s, a.z * s};
}

Vec3 operator/(const Vec3& a, double s) {
    return {a.x / s, a.y / s, a.z / s};
}

Vec3 operator/(double s, const Vec3& a) {
    return {a.x / s, a.y / s, a.z / s};
}

Vec3::Vec3(double x, double y, double z):
    x(x), y(y), z(z)
{}

double Vec3::length() const {
    return sqrt(x * x + y * y + z * z);
}

Vec3& Vec3::normalize() {
    *this = *this / length();
    return *this;
}


//------------------------------------------------------------------------------
// Node 
//------------------------------------------------------------------------------

struct Node {
public:
    Node(int id);
public:
    int id;
    Node* adj[4] { nullptr, nullptr, nullptr, nullptr };
};

Node::Node(int id):
    id(id)
{}

//------------------------------------------------------------------------------
// Gem 
//------------------------------------------------------------------------------

struct Gem {
public:
    Gem() = default;
    Gem(const std::vector<int> &data);

    Gem(Gem &&other) = default;
    Gem& operator=(Gem&& other) = default;

    Node& operator[](std::size_t index);

public:
    std::vector<std::unique_ptr<Node>> vertices;
};

Node& Gem::operator[](std::size_t label) {
    int index = label-1;
    if (index >= vertices.size()) {
        vertices.resize(index+1);
    }
    if (vertices[index].get() == nullptr) {
        vertices[index].reset(new Node(label));
    }
    return *vertices[index].get();
}

Gem::Gem(const std::vector<int> &data) {
    auto &gem = *this;
    std::size_t label = 0;
    for (auto i=0;i<data.size();i+=4) {
        ++label;
        auto &v = gem[label];
        v.adj[0] = &gem[data[i + 0]];
        v.adj[1] = &gem[data[i + 1]];
        v.adj[2] = &gem[data[i + 2]];
        v.adj[3] = &gem[data[i + 3]];
    }
}

std::ostream& operator<<(std::ostream& os, const Node& node) {
    auto lbl = [](Node *n) {
        if (n == nullptr)
            return std::string("-1");
        else
            return std::to_string(n->id);
    };
    os << lbl(node.adj[0]) << ","
       << lbl(node.adj[1]) << ","
       << lbl(node.adj[2]) << ","
       << lbl(node.adj[3]);
    return os;
}

std::ostream& operator<<(std::ostream& os, const Gem& gem) {
    bool first = true;
    for (auto &it: gem.vertices) {
        auto v = it.get();
        if (!first)
            os << "," << std::endl;
        os << *v;
        first = false;
    }
    os << std::endl;
    return os;
}

Gem read(std::istream& is);

//------------------------------------------------------------------------------
// split 
//------------------------------------------------------------------------------

std::vector<std::string> split(const std::string& input, const std::regex& regex) {
    // passing -1 as the submatch index parameter performs splitting
    std::sregex_token_iterator
        first{input.begin(), input.end(), regex, -1},
        last;
    return {first, last};
}

//------------------------------------------------------------------------------
// Impl. 
//------------------------------------------------------------------------------

Gem read(std::istream& is) {
    std::vector<int> values;
    std::string line;
    std::regex  separators("[,\\s\\t\\n]+");
    while (std::getline(is, line)) {
        std::vector<std::string> tokens = split(line, separators);
        std::for_each(tokens.begin(), tokens.end(), [&](std::string number_st) {
                // std::cout << ">>>" << number_st << "<<<" << std::endl;
                if (number_st.size())
                    values.push_back(std::stoi(number_st));
            });
    }
    // for (auto v: values) {
    //     std::cout << v << " ";
    // }
    // std::cout << std::endl;
    return Gem(values);
}


//------------------------------------------------------------------------------
// main
//------------------------------------------------------------------------------

int main(int argc, char **argv) {
    std::vector<std::string> params {argv, argv+argc};
    Options options(params);

    std::ifstream ifs(options.input.getValue());
    Gem gem = read(ifs);

    std::cout << gem;
}
