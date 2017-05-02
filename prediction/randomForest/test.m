clear;
clc;

fea = csvread('fea1112.csv')
gnd = csvread('gnd1112.csv')
gnd = gnd';
% 
% numTrain = [10, 50, 100, 125, 150, 190, 250, 370];
% forest_acc = [];
% 
% for i=numTrain
%    opts.numTrees = i;
%    trainFea = fea(1:i,:);
%    trainLabel = gnd(1:i,:);
%    testFea = fea(i+1:380,:);
%    testLabel = gnd(i+1:380,:);
%    m = forestTrain(trainFea, trainLabel, opts);
%    forestLabel = forestTest(m, testFea, opts);
%    acc = sum(forestLabel == testLabel) / 190;
%    forest_acc = [forest_acc acc];
% 
% end
    numTrain = 370;
    trainFea = fea(1:numTrain,:);
    trainLabel = gnd(1:numTrain,:);
    testFea = fea(numTrain+1:380,:);
    testLabel = gnd(numTrain+1:380,:);

   treeModel = TreeBagger(numTrain,trainFea, trainLabel,'OOBPrediction','On','Method','classification');
   treeLabel = predict(treeModel, testFea);
%    treeacc = sum(treeLabel == testLabel) / length(testLabel);
%    tree_acc = [tree_acc treeacc];    
%    m = forestTrain(trainFea, trainLabel, opts);
%    forestLabel = forestTest(m, testFea, opts);
%    
%     treeLabel = cell2table(treeLabel);
    treeLabel = str2double(treeLabel);
    acc = sum(treeLabel == testLabel) / length(testLabel);

% plot(numTrain, forest_acc);
% title('Predict - Season 14-15')
% xlabel('Number of training')
% % xticks(numTrain)
% ylabel('Accuracy')
% % legend('SVM-Linear','SVM-Polynomial', 'SVM-Gausian','Random Forest', 'Location','southeast');

