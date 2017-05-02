fea = csvread('fea1112.csv');
gnd = csvread('gnd1112.csv');
gnd = gnd';

numTrain = [10, 50, 100, 125, 150, 190, 250, 370];
lin_acc = [];
poly_acc = [];
gau_acc = [];
forest_acc = [];
knn_acc = [];
tree_acc = [];
for i=numTrain
   lin = predictSVM(fea, gnd, i, 'lin');
   lin_acc = [lin_acc lin];
    
   poly = predictSVM(fea, gnd, i, 'poly');
   poly_acc = [poly_acc poly];
   
   gau = predictSVM(fea, gnd, i, 'gau');
   gau_acc = [gau_acc gau];
   
   m = forestTrain(fea(1:i,:), gnd(1:i,:));
   forestLabel = forestTest(m, fea(i+1:380,:));
   acc = sum(forestLabel == gnd(i+1:380,:)) / length(gnd(i+1:380,:));
   forest_acc = [forest_acc acc];
   
   knnModel = fitcknn(fea(1:i,:), gnd(1:i,:));
   knnLabel = predict(knnModel, fea(i+1:380,:));
   kacc = sum(knnLabel == gnd(i+1:380,:)) / length(gnd(i+1:380,:));
   knn_acc = [knn_acc kacc];
   
   treeModel = TreeBagger(i,fea, gnd,'OOBPrediction','On',...,'Method','classification');
   treeLabel = predict(treeModel, fea(i+1:380,:));
   treeacc = sum(treeLabel == gnd(i+1:380,:)) / length(gnd(i+1:380,:));
   tree_acc = [tree_acc treeacc];

end
plot(numTrain, lin_acc, numTrain, poly_acc, numTrain, gau_acc, numTrain, forest_acc, numTrain, knn_acc, numTrain, tree_acc);
title('Season 15-16')
xlabel('Number of training')
% xticks(numTrain)
ylabel('Accuracy')
legend('SVM-Linear','SVM-Polynomial', 'SVM-Gausian','Random Forest','KNN', 'Location','southeast');