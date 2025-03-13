const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function activate(context) {
    console.log('恭喜，你的插件 "ros-quick-runner" 已经激活！');

    let disposable = vscode.commands.registerCommand('ros-launcher.roslaunch', async (uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('请在文件资源管理器中右键点击 launch 文件');
            return;
        }

        const filePath = uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);

        if (!workspaceFolder) {
            vscode.window.showErrorMessage('无法确定工作区文件夹');
            return;
        }

        // 获取包名
        const packageName = await getPackageNameFromPath(filePath);
        if (!packageName) {
            vscode.window.showErrorMessage('无法找到有效的 ROS 包名');
            return;
        }

        const launchFileName = path.basename(filePath);

        // 创建终端并执行 roslaunch 命令
        const terminal = vscode.window.createTerminal('ROS Launch');
        terminal.show();
        terminal.sendText(`roslaunch ${packageName} ${launchFileName}`);
    });

    context.subscriptions.push(disposable);
}

async function getPackageNameFromPath(filePath) {
    let currentPath = path.dirname(filePath);
    let depth = 0; // 添加一个计数器，用于记录查找的深度
    const maxDepth = 10; // 设置最大查找深度为 10 层

    // 向上查找 package.xml 文件，最多查找 10 层
    while (currentPath !== path.dirname(currentPath) && depth < maxDepth) {
        const packageXmlPath = path.join(currentPath, 'package.xml');
        if (fs.existsSync(packageXmlPath)) {
            // 解析 package.xml 文件获取包名
            const packageXmlContent = fs.readFileSync(packageXmlPath, 'utf8');
            const match = /<name>([\w-]+)<\/name>/.exec(packageXmlContent); // 使用正则表达式匹配包名
            if (match && match[1]) {
                return match[1]; // 返回包名
            }
        }
        currentPath = path.dirname(currentPath); // 上移一级目录
        depth++; // 增加深度计数
    }

    return null; // 未找到 package.xml 文件
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;